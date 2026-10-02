from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from sqlalchemy import create_engine, text

import os
import sys
import re
import uuid
import pdfplumber
import pytesseract
from PIL import Image
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from model import get_final_prediction

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# =========================
# CONFIG (LOCAL STORAGE & HOSTING)
# =========================
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
REPORT_FOLDER = os.path.join(BASE_DIR, "generated_reports")
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

# Local SQLite database
DB_PATH = os.path.join(BASE_DIR, "diabetes_app.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
engine = create_engine(DATABASE_URL)

def init_db():
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    CREATE TABLE IF NOT EXISTS patient_reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        filename TEXT,
                        hba1c REAL,
                        bmi REAL,
                        age INTEGER,
                        tg REAL,
                        urea REAL,
                        prediction TEXT,
                        confidence TEXT,
                        explanation TEXT,
                        report_pdf TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
            )
            conn.commit()
            print("Local SQLite database initialized at:", DB_PATH)
    except Exception as e:
        print("Database initialization error:", e)

init_db()

# =========================
# HELPERS
# =========================
def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def extract_value(pattern, text, cast=float):
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        try:
            return cast(match.group(1))
        except:
            return None
    return None


def extract_medical_values(text):
    extracted = {
        "HbA1c": None,
        "BMI": None,
        "AGE": None,
        "TG": None,
        "Urea": None
    }

    if not text:
        return extracted

    # 1. AGE (Patient Demographics)
    age_patterns = [
        r'Age\/Gender\s*:\s*(\d+)\s*Y',
        r'Female,\s*(\d+)\s*Yrs',
        r'Male,\s*(\d+)\s*Yrs',
        r'(?:Sex\s*[\/|]\s*Age|Patient\s*Age)[\s:>=-]+(?:MALE|FEMALE|M|F)?[\s\/|:]*(\d{1,3})\s*(?:Y|Years|Yrs)?',
        r'(?:Age|Age\s*\(Years\))\s*:\s*(\d{1,3})',
        r'(\d{1,3})\s*(?:Years|Yrs)\s*(?:Old)?',
    ]
    for p in age_patterns:
        m = re.search(p, text, re.I)
        if m:
            try:
                val = int(m.group(1))
                if 5 <= val <= 110:
                    extracted["AGE"] = val
                    break
            except Exception:
                pass

    # 2. TG (Triglycerides)
    tg_patterns = [
        r'(?:Serum|Sr\.?)?\s*Triglycerides?[\s:>=-]+(\d+\.?\d*)',
        r'Triglycerides?[\s:*=-]+(\d+\.?\d*)',
        r'Triglycerides.*?(\d+\.?\d*)\s*mg\/dl',
        r'Serum Triglycerides.*?(\d+\.?\d*)\s*mg\/dl'
    ]
    for p in tg_patterns:
        m = re.search(p, text, re.I)
        if m:
            try:
                extracted["TG"] = float(m.group(1))
                break
            except Exception:
                pass

    # If TG not directly found, check VLDL (TG = VLDL * 5 in clinical lipid profiles)
    if extracted["TG"] is None:
        vldl_m = re.search(r'VLDL[\s:>=-]+(\d+\.?\d*)', text, re.I)
        if vldl_m:
            try:
                extracted["TG"] = round(float(vldl_m.group(1)) * 5.0, 1)
            except Exception:
                pass

    # 3. HbA1c
    hba1c_patterns = [
        r'HbA1c.*?(\d+\.?\d*)\s*%',
        r'Hba1c.*?(\d+\.?\d*)\s*%',
        r'Glycosylated Hemoglobin.*?(\d+\.?\d*)\s*%',
        r'Glycated Hemoglobin.*?(\d+\.?\d*)',
        r'HbA1c[\s:=-]+(\d+\.?\d*)'
    ]
    for p in hba1c_patterns:
        for match in re.finditer(p, text, re.I):
            val_str = match.group(1)
            start = max(0, match.start() - 30)
            ctx = text[start:match.start()].lower()
            if 'criteria' not in ctx and '>=' not in ctx and '<=' not in ctx:
                try:
                    hba1c_val = float(val_str)
                    if 3.0 <= hba1c_val <= 20.0:
                        extracted["HbA1c"] = hba1c_val
                        break
                except Exception:
                    pass
        if extracted["HbA1c"] is not None:
            break

    # If HbA1c was not tested directly, estimate from Fasting & PP Glucose via ADA formula
    if extracted["HbA1c"] is None:
        fasting_m = re.search(r'(?:Blood\s*Glucose\s*Fasting|Fasting\s*Blood\s*Sugar|Fasting\s*Glucose)[\s:>=-|]*(\d+\.?\d*)', text, re.I)
        if not fasting_m:
            fasting_m = re.search(r'(\d{2,3}\.?\d*)\s*.*?(?:Blood\s*Glucose\s*Fasting|Fasting\s*Blood\s*Sugar)', text, re.I)

        pp_m = re.search(r'(?:Glucose\s*Post\s*Lunch|Post\s*Lunch|PPBS|Post\s*Prandial)[\s:>=-|]*(\d+\.?\d*)', text, re.I)
        if not pp_m:
            pp_m = re.search(r'(\d{2,3}\.?\d*)\s*.*?(?:Glucose\s*Post\s*Lunch|Post\s*Lunch)', text, re.I)

        if fasting_m or pp_m:
            try:
                fbs = float(fasting_m.group(1)) if fasting_m else None
                ppbs = float(pp_m.group(1)) if pp_m else None
                if fbs and ppbs:
                    avg_glu = (fbs + ppbs) / 2.0
                elif fbs:
                    avg_glu = fbs
                else:
                    avg_glu = ppbs
                extracted["HbA1c"] = round((avg_glu + 46.7) / 28.7, 1)
            except Exception:
                pass

    # 4. Urea
    urea_patterns = [
        r'(?:Blood\s*)?Urea[\s:>=-]+(\d+\.?\d*)',
        r'Blood Urea.*?(\d+\.?\d*)\s*mg\/dl',
        r'Urea.*?(\d+\.?\d*)\s*mg\/dl',
        r'BUN[\s:>=-]+(\d+\.?\d*)'
    ]
    for p in urea_patterns:
        m = re.search(p, text, re.I)
        if m:
            try:
                extracted["Urea"] = float(m.group(1))
                break
            except Exception:
                pass

    # 5. BMI
    bmi_patterns = [
        r'\bBMI\b[\s:>=-]+(\d+\.?\d*)',
        r'Body\s*Mass\s*Index[\s:>=-]+(\d+\.?\d*)'
    ]
    for p in bmi_patterns:
        m = re.search(p, text, re.I)
        if m:
            try:
                extracted["BMI"] = float(m.group(1))
                break
            except Exception:
                pass

    # Convert TG mg/dL -> mmol/L if > 15
    if extracted["TG"] is not None and extracted["TG"] > 15:
        extracted["TG"] = round(extracted["TG"] / 88.57, 2)

    # Convert Urea mg/dL -> mmol/L if > 15
    if extracted["Urea"] is not None and extracted["Urea"] > 15:
        extracted["Urea"] = round(extracted["Urea"] / 6.0, 2)

    # Clinical baselines for biomarkers not measured in blood lab sheets (e.g. BMI, Urea)
    if extracted["BMI"] is None:
        extracted["BMI"] = 24.5

    if extracted["Urea"] is None:
        extracted["Urea"] = 4.5

    return extracted


def extract_pdf_text(path):
    full_text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            # If no embedded text (scanned image-based PDF), run OCR on rendered page images
            if not full_text.strip():
                print("Running OCR on scanned PDF pages:", os.path.basename(path))
                for page in pdf.pages:
                    try:
                        img = page.to_image(resolution=200).original
                        ocr_page_text = pytesseract.image_to_string(img)
                        if ocr_page_text:
                            full_text += ocr_page_text + "\n"
                    except Exception as page_err:
                        print("Page OCR error:", page_err)
    except Exception as e:
        print("Notice: PDF text extraction could not read text:", e)

    return full_text


def extract_image_text(path):
    try:
        image = Image.open(path)
        return pytesseract.image_to_string(image)
    except Exception as e:
        print("Notice: Image OCR extraction could not read text:", e)
        return ""


def split_text(text, max_chars=80):
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        if len(current_line + " " + word) <= max_chars:
            current_line += " " + word
        else:
            lines.append(current_line.strip())
            current_line = word

    if current_line:
        lines.append(current_line.strip())

    return lines


# =========================
# STATIC FILE SERVING (LOCAL STORAGE)
# =========================
@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/reports/<path:filename>", methods=["GET"])
def serve_generated_report(filename):
    return send_from_directory(REPORT_FOLDER, filename)


# =========================
# HEALTH CHECK & HISTORY
# =========================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "diabetes-predictor",
        "storage": "local-sqlite",
        "model": "neural-network-ml"
    }), 200


@app.route("/patient-reports", methods=["GET"])
def get_patient_reports():
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, filename, hba1c, bmi, age, tg, urea, prediction, confidence, explanation, report_pdf, created_at FROM patient_reports ORDER BY id DESC")
            )
            rows = []
            for row in result:
                rows.append({
                    "id": row[0],
                    "filename": row[1],
                    "hba1c": row[2],
                    "bmi": row[3],
                    "age": row[4],
                    "tg": row[5],
                    "urea": row[6],
                    "prediction": row[7],
                    "confidence": row[8],
                    "explanation": row[9],
                    "report_pdf": row[10],
                    "created_at": str(row[11]) if row[11] else None
                })
            return jsonify({"reports": rows}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve reports: {str(e)}"}), 500


# =========================
# REPORT UPLOAD + OCR
# =========================
@app.route("/upload-reports", methods=["POST"])
def upload_reports():
    try:
        if "reports" not in request.files:
            return jsonify({"error": "No report files uploaded"}), 400

        files = request.files.getlist("reports")

        extracted = {
            "HbA1c": None,
            "BMI": None,
            "AGE": None,
            "TG": None,
            "Urea": None,
        }

        uploaded_files = []
        uploaded_urls = []

        host_url = request.host_url.rstrip("/")

        for file in files:
            if file.filename == "":
                continue

            if not allowed_file(file.filename):
                return jsonify(
                    {"error": f"Unsupported file type: {file.filename}"}
                ), 400

            original_name = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4().hex}_{original_name}"
            save_path = os.path.join(UPLOAD_FOLDER, unique_name)

            file.save(save_path)

            # Local URL for the uploaded file
            file_url = f"{host_url}/uploads/{unique_name}"

            uploaded_files.append(original_name)
            uploaded_urls.append(file_url)

            extension = original_name.rsplit(".", 1)[1].lower()

            if extension == "pdf":
                text_content = extract_pdf_text(save_path)
            else:
                text_content = extract_image_text(save_path)

            values = extract_medical_values(text_content)

            for key, value in values.items():
                if extracted[key] is None and value is not None:
                    extracted[key] = value

        return jsonify(
            {
                "message": "Reports processed successfully",
                "uploaded_files": uploaded_files,
                "uploaded_urls": uploaded_urls,
                "extracted": extracted,
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"error": f"Failed to process uploaded reports: {str(e)}"}
        ), 500


# =========================
# PREDICTION (ML MODEL)
# =========================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {"error": "Invalid request. JSON payload is required."}
            ), 400

        keys_required = {
            "hba1c": ["HbA1c", "hba1c"],
            "bmi": ["BMI", "bmi"],
            "age": ["AGE", "Age", "age"],
            "tg": ["TG", "tg"],
            "urea": ["Urea", "urea"],
        }

        extracted_features = {}
        missing_features = []

        for feature, possible_keys in keys_required.items():
            value = None

            for key in possible_keys:
                if key in data:
                    value = data[key]
                    break

            if value is None:
                missing_features.append(possible_keys[0])
                continue

            try:
                extracted_features[feature] = float(value)
            except ValueError:
                return jsonify(
                    {
                        "error": f"Invalid value for {possible_keys[0]}. Must be numeric."
                    }
                ), 400

        if missing_features:
            return jsonify(
                {
                    "error": f"Missing required numeric fields: {', '.join(missing_features)}"
                }
            ), 400

        # Run pure ML prediction
        result = get_final_prediction(
            hba1c=extracted_features["hba1c"],
            bmi=extracted_features["bmi"],
            age=extracted_features["age"],
            tg=extracted_features["tg"],
            urea=extracted_features["urea"],
        )

        print("ML Prediction Result:", result)

        if "error" in result:
            return jsonify(result), 500

        # Store prediction locally in SQLite
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("""
                        INSERT INTO patient_reports
                        (
                            filename,
                            hba1c,
                            bmi,
                            age,
                            tg,
                            urea,
                            prediction,
                            confidence,
                            explanation
                        )
                        VALUES
                        (
                            :filename,
                            :hba1c,
                            :bmi,
                            :age,
                            :tg,
                            :urea,
                            :prediction,
                            :confidence,
                            :explanation
                        )
                    """),
                    {
                        "filename": data.get("filename", "manual-entry"),
                        "hba1c": extracted_features["hba1c"],
                        "bmi": extracted_features["bmi"],
                        "age": int(extracted_features["age"]),
                        "tg": extracted_features["tg"],
                        "urea": extracted_features["urea"],
                        "prediction": result.get("prediction"),
                        "confidence": str(result.get("confidence")),
                        "explanation": result.get("explanation"),
                    }
                )
                conn.commit()
        except Exception as db_error:
            print("Local database insert failed:", db_error)

        return jsonify(result), 200

    except Exception as e:
        return jsonify(
            {"error": f"Prediction failed: {str(e)}"}
        ), 500


# =========================
# PDF REPORT DOWNLOAD
# =========================
@app.route("/download-report", methods=["POST"])
def download_report():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No report data provided"}), 400

        filename = f"report_{uuid.uuid4().hex}.pdf"
        filepath = os.path.join(REPORT_FOLDER, filename)

        pdf = canvas.Canvas(filepath, pagesize=letter)

        y = 760

        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawString(50, y, "Diabetes Risk Assessment Report")

        y -= 35
        pdf.setFont("Helvetica", 11)
        pdf.drawString(
            50,
            y,
            f"Generated At: {data.get('generatedAt', 'N/A')}",
        )

        # =========================
        # Prediction Summary
        # =========================
        result = data.get("result", {})
        summary = result.get("summary", {})

        y -= 40
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(50, y, "Prediction Summary")

        y -= 25
        pdf.setFont("Helvetica", 12)
        pdf.drawString(
            50,
            y,
            f"Risk Level: {result.get('risk', 'Unknown')}",
        )

        y -= 20
        pdf.drawString(
            50,
            y,
            f"Risk Probability: {result.get('probability', 0)}%",
        )

        # =========================
        # Patient Values
        # =========================
        y -= 40
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(50, y, "Patient Values")

        y -= 25
        pdf.setFont("Helvetica", 12)

        pdf.drawString(50, y, f"HbA1c: {summary.get('hba1c', 'N/A')} %")
        y -= 20

        pdf.drawString(50, y, f"BMI: {summary.get('bmi', 'N/A')} kg/m²")
        y -= 20

        pdf.drawString(50, y, f"Age: {summary.get('age', 'N/A')} years")
        y -= 20

        pdf.drawString(50, y, f"TG: {summary.get('tg', 'N/A')} mmol/L")
        y -= 20

        pdf.drawString(50, y, f"Urea: {summary.get('urea', 'N/A')} mmol/L")

        # =========================
        # Explanation
        # =========================
        y -= 40
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(50, y, "Clinical Explanation")

        y -= 25
        pdf.setFont("Helvetica", 11)

        explanation = result.get(
            "explanation",
            "No explanation available.",
        )

        for line in split_text(explanation, 90):
            pdf.drawString(50, y, line)
            y -= 18

        # =========================
        # Recommendations
        # =========================
        y -= 20
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(50, y, "Recommendations")

        y -= 25
        pdf.setFont("Helvetica", 11)

        for recommendation in result.get("recommendations", []):
            pdf.drawString(60, y, f"• {recommendation}")
            y -= 18

            if y < 80:
                pdf.showPage()
                y = 760
                pdf.setFont("Helvetica", 11)

        # =========================
        # Uploaded Reports
        # =========================
        uploaded_reports = data.get("uploadedReports", [])

        if uploaded_reports:
            y -= 20
            pdf.setFont("Helvetica-Bold", 15)
            pdf.drawString(50, y, "Uploaded Reports")

            y -= 25
            pdf.setFont("Helvetica", 11)

            for report in uploaded_reports:
                pdf.drawString(60, y, f"• {report}")
                y -= 18

        pdf.save()

        host_url = request.host_url.rstrip("/")
        pdf_url = f"{host_url}/reports/{filename}"

        # Update latest record in local SQLite database
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("""
                        UPDATE patient_reports
                        SET report_pdf = :pdf_url
                        WHERE id = (
                            SELECT id
                            FROM patient_reports
                            ORDER BY id DESC
                            LIMIT 1
                        )
                    """),
                    {"pdf_url": pdf_url}
                )
                conn.commit()
        except Exception as db_error:
            print("Failed to save PDF URL in local DB:", db_error)

        # If client explicitly asked for JSON
        if request.headers.get("Accept") == "application/json" or request.args.get("format") == "json":
            return jsonify({
                "message": "Report generated successfully",
                "pdf_url": pdf_url
            }), 200

        # Otherwise return the actual PDF file as attachment so response.blob() gets a real PDF
        response = send_file(
            filepath,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
        response.headers["X-PDF-URL"] = pdf_url
        response.headers["Access-Control-Expose-Headers"] = "X-PDF-URL"
        return response

    except Exception as e:
        return jsonify(
            {"error": f"Failed to generate PDF report: {str(e)}"}
        ), 500


# =========================
# START SERVER
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    try:
        app.run(host="0.0.0.0", port=port, debug=True)
    except OSError as e:
        if "Address already in use" in str(e) and port == 5000:
            print("Port 5000 is occupied by macOS AirPlay, falling back to 5001...")
            app.run(host="0.0.0.0", port=5001, debug=True)
        else:
            raise