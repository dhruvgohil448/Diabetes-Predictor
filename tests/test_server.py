import pytest
import os
import sys
import io
import json

# Ensure backend directory is in sys.path
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from server import app, engine, text, DB_PATH, UPLOAD_FOLDER, REPORT_FOLDER


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Verify health endpoint indicates local hosting and SQLite."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["storage"] == "local-sqlite"
    assert data["model"] == "neural-network-ml"


def test_sqlite_db_initialized():
    """Verify that the SQLite database file exists and table is initialized."""
    assert os.path.exists(DB_PATH), f"SQLite database should exist at {DB_PATH}"
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='patient_reports'")).fetchone()
        assert result is not None, "patient_reports table must exist in SQLite database"


def test_predict_endpoint_success(client):
    """Verify /predict endpoint returns ML prediction and saves to local SQLite."""
    payload = {
        "HbA1c": 8.0,
        "BMI": 31.0,
        "AGE": 50,
        "TG": 2.5,
        "Urea": 6.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "prediction" in data
    assert data["prediction"] == "Diabetic"
    assert "probability" in data
    assert "explanation" in data
    assert "precautions" in data
    assert "fuzzy_score" not in data

    # Verify record in SQLite
    with engine.connect() as conn:
        row = conn.execute(text("SELECT filename, hba1c, bmi, prediction FROM patient_reports ORDER BY id DESC LIMIT 1")).fetchone()
        assert row is not None
        assert row[1] == 8.0
        assert row[2] == 31.0
        assert row[3] == "Diabetic"


def test_predict_endpoint_missing_fields(client):
    """Verify /predict validates required numeric fields."""
    response = client.post("/predict", json={"HbA1c": 6.5})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "Missing required numeric fields" in data["error"]


def test_predict_endpoint_invalid_values(client):
    """Verify /predict rejects non-numeric field values."""
    response = client.post("/predict", json={
        "HbA1c": "abc",
        "BMI": 25.0,
        "AGE": 30,
        "TG": 1.5,
        "Urea": 5.0
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_download_report_pdf(client):
    """Verify /download-report generates a real PDF locally and updates SQLite DB."""
    # Ensure there is at least one report in DB
    client.post("/predict", json={
        "HbA1c": 7.5,
        "BMI": 29.0,
        "AGE": 48,
        "TG": 2.2,
        "Urea": 5.8
    })

    payload = {
        "generatedAt": "10/2/2026, 6:30:00 PM",
        "patient": {
            "HbA1c": 7.5,
            "BMI": 29.0,
            "AGE": 48,
            "TG": 2.2,
            "Urea": 5.8
        },
        "result": {
            "risk": "Diabetic",
            "probability": 88,
            "explanation": "High HbA1c levels indicate long-term chronic blood sugar elevation.",
            "recommendations": ["Consult a specialist", "Monitor blood glucose"],
            "summary": {
                "hba1c": 7.5,
                "bmi": 29.0,
                "age": 48,
                "tg": 2.2,
                "urea": 5.8
            }
        },
        "uploadedReports": ["blood_test.pdf"]
    }

    response = client.post("/download-report", json=payload)
    assert response.status_code == 200
    assert response.content_type == "application/pdf"
    assert response.data.startswith(b"%PDF-")

    # Check X-PDF-URL header
    pdf_url = response.headers.get("X-PDF-URL")
    assert pdf_url is not None
    assert "/reports/" in pdf_url

    # Check that file exists on disk locally
    filename = pdf_url.split("/reports/")[-1]
    local_pdf_path = os.path.join(REPORT_FOLDER, filename)
    assert os.path.exists(local_pdf_path)

    # Check that static endpoint serves this file
    static_resp = client.get(f"/reports/{filename}")
    assert static_resp.status_code == 200
    assert static_resp.data.startswith(b"%PDF-")


def test_download_report_json_request(client):
    """Verify /download-report returns JSON if explicitly requested via Accept header."""
    payload = {
        "generatedAt": "10/2/2026, 6:30:00 PM",
        "result": {
            "risk": "Non-Diabetic",
            "probability": 15,
            "summary": {"hba1c": 5.0, "bmi": 22.0, "age": 30, "tg": 1.0, "urea": 4.0}
        }
    }
    response = client.post("/download-report", json=payload, headers={"Accept": "application/json"})
    assert response.status_code == 200
    data = response.get_json()
    assert "pdf_url" in data
    assert "/reports/" in data["pdf_url"]


def test_patient_reports_history_endpoint(client):
    """Verify /patient-reports retrieves records stored in SQLite."""
    response = client.get("/patient-reports")
    assert response.status_code == 200
    data = response.get_json()
    assert "reports" in data
    assert len(data["reports"]) > 0
    first_report = data["reports"][0]
    assert "prediction" in first_report
    assert "hba1c" in first_report


def test_upload_reports_locally(client):
    """Verify file upload saves file to local backend/uploads and returns local URL."""
    test_content = b"%PDF-1.4 dummy pdf content for testing local upload"
    data = {
        "reports": (io.BytesIO(test_content), "test_patient_report.pdf")
    }
    response = client.post("/upload-reports", data=data, content_type="multipart/form-data")
    assert response.status_code == 200
    res_data = response.get_json()
    assert "uploaded_files" in res_data
    assert "test_patient_report.pdf" in res_data["uploaded_files"]
    assert "uploaded_urls" in res_data
    assert len(res_data["uploaded_urls"]) == 1
    local_url = res_data["uploaded_urls"][0]
    assert "/uploads/" in local_url

    # Check file exists on disk
    filename = local_url.split("/uploads/")[-1]
    assert os.path.exists(os.path.join(UPLOAD_FOLDER, filename))

    # Check static route serves uploaded file
    static_res = client.get(f"/uploads/{filename}")
    assert static_res.status_code == 200
    assert static_res.data == test_content


def test_upload_real_pdf_and_ocr(client):
    """Verify uploading an actual medical PDF extracts clinical values and stores file locally."""
    sample_pdf = os.path.join(UPLOAD_FOLDER, "e0dea4162425475c84107fbb5e77434f_GAURAV_DESAI_report.pdf")
    if os.path.exists(sample_pdf):
        with open(sample_pdf, "rb") as f:
            pdf_bytes = f.read()

        data = {
            "reports": (io.BytesIO(pdf_bytes), "sample_gaurav_report.pdf")
        }
        response = client.post("/upload-reports", data=data, content_type="multipart/form-data")
        assert response.status_code == 200
        res_data = response.get_json()
        assert "extracted" in res_data
        assert res_data["extracted"]["HbA1c"] == 5.8
        assert res_data["extracted"]["AGE"] == 50
        assert len(res_data["uploaded_urls"]) == 1
        assert "http://localhost/uploads/" in res_data["uploaded_urls"][0]


def test_upload_scanned_pdf_and_ocr(client):
    """Verify uploading a scanned medical PDF runs OCR on pages and extracts patient values."""
    sample_pdf = os.path.join(UPLOAD_FOLDER, "7d2e156b67754d1e8093901552185a74_Diabetes-report.pdf")
    if os.path.exists(sample_pdf):
        with open(sample_pdf, "rb") as f:
            pdf_bytes = f.read()

        data = {
            "reports": (io.BytesIO(pdf_bytes), "Diabetes-report.pdf")
        }
        response = client.post("/upload-reports", data=data, content_type="multipart/form-data")
        assert response.status_code == 200
        res_data = response.get_json()
        assert "extracted" in res_data
        assert res_data["extracted"]["AGE"] == 45
        assert res_data["extracted"]["HbA1c"] == 6.5
        assert res_data["extracted"]["TG"] == 2.06
        assert res_data["extracted"]["BMI"] is not None
        assert res_data["extracted"]["Urea"] is not None


