from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from model import get_final_prediction

import os
import re
import uuid
import pdfplumber
import pytesseract
from PIL import Image
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = Flask(__name__)
CORS(app)

# =========================
# CONFIG
# =========================
UPLOAD_FOLDER = "uploads"
REPORT_FOLDER = "generated_reports"
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

# If using Windows, uncomment and set your Tesseract path:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


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

    patterns = {
        "HbA1c": [
            r"HbA1c.*?(\d+\.?\d*)\s*%",
            r"Hba1c.*?(\d+\.?\d*)\s*%",
            r"Glycosylated Hemoglobin.*?(\d+\.?\d*)\s*%"
        ],

        "AGE": [
            r"Female,\s*(\d+)\s*Yrs",
            r"Male,\s*(\d+)\s*Yrs",
            r"Age\/Gender\s*:\s*(\d+)\s*Y"
        ],

        "TG": [
            r"Serum Triglycerides.*?(\d+\.?\d*)\s*mg\/dl",
            r"Triglycerides.*?(\d+\.?\d*)\s*mg\/dl"
        ],

        "Urea": [
            r"Blood Urea.*?(\d+\.?\d*)\s*mg\/dl",
            r"Urea.*?(\d+\.?\d*)\s*mg\/dl"
        ],

        "BMI": [
            r"\bBMI\b\s*[:=-]?\s*(\d+\.?\d*)"
        ]
    }

    for field, regex_list in patterns.items():
        for pattern in regex_list:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)

            if match:
                value = match.group(1)

                try:
                    if field == "AGE":
                        extracted[field] = int(value)
                    else:
                        extracted[field] = float(value)
                    break
                except:
                    pass

    # Convert TG from mg/dL -> mmol/L
    if extracted["TG"] is not None:
        extracted["TG"] = round(extracted["TG"] / 88.57, 2)

    # Convert Urea from mg/dL -> mmol/L
    if extracted["Urea"] is not None:
        extracted["Urea"] = round(extracted["Urea"] / 6.0, 2)

    return extracted

def extract_pdf_text(path):
    full_text = ""

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    return full_text


def extract_image_text(path):
    image = Image.open(path)
    return pytesseract.image_to_string(image)


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
            uploaded_files.append(original_name)

            extension = original_name.rsplit(".", 1)[1].lower()

            # Extract text
            if extension == "pdf":
                text = extract_pdf_text(save_path)
            else:
                text = extract_image_text(save_path)

            print(f"\n===== OCR TEXT FROM {original_name} =====")
            print(text[:1000])

            values = extract_medical_values(text)

            # Fill only missing fields
            for key, value in values.items():
                if extracted[key] is None and value is not None:
                    extracted[key] = value

        return jsonify(
            {
                "message": "Reports processed successfully",
                "uploaded_files": uploaded_files,
                "extracted": extracted,
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"error": f"Failed to process uploaded reports: {str(e)}"}
        ), 500


# =========================
# PREDICTION
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

        result = get_final_prediction(
            hba1c=extracted_features["hba1c"],
            bmi=extracted_features["bmi"],
            age=extracted_features["age"],
            tg=extracted_features["tg"],
            urea=extracted_features["urea"],
        )

        print("Prediction Result:", result)

        if "error" in result:
            return jsonify(result), 500

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
            f"Probability: {result.get('probability', 0)}%",
        )

        # =========================
        # Patient Values
        # =========================
        y -= 40
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(50, y, "Patient Values")

        y -= 25
        pdf.setFont("Helvetica", 12)

        pdf.drawString(50, y, f"HbA1c: {summary.get('hba1c', 'N/A')}")
        y -= 20

        pdf.drawString(50, y, f"BMI: {summary.get('bmi', 'N/A')}")
        y -= 20

        pdf.drawString(50, y, f"Age: {summary.get('age', 'N/A')}")
        y -= 20

        pdf.drawString(50, y, f"TG: {summary.get('tg', 'N/A')}")
        y -= 20

        pdf.drawString(50, y, f"Urea: {summary.get('urea', 'N/A')}")

        # =========================
        # Explanation
        # =========================
        y -= 40
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(50, y, "Explanation")

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

        return send_file(
            filepath,
            as_attachment=True,
            download_name="diabetes_report.pdf",
            mimetype="application/pdf",
        )

    except Exception as e:
        return jsonify(
            {"error": f"Failed to generate PDF report: {str(e)}"}
        ), 500


# =========================
# START SERVER
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)