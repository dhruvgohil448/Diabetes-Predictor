# Hybrid Diabetes Prediction System

An AI-powered healthcare web application that predicts diabetes risk using patient medical values and uploaded lab reports.

The system combines:

* Machine Learning prediction
* Fuzzy Logic explanation
* OCR-based extraction from uploaded reports
* AWS cloud deployment
* Automatic PDF report generation

---

# Features

* Upload PDF, JPG, JPEG, or PNG medical reports
* Extract values automatically using OCR
* Predict diabetes risk using ML + fuzzy logic
* Generate downloadable PDF reports
* Store uploaded reports and generated PDFs in AWS S3
* Save prediction history in AWS RDS PostgreSQL
* Host frontend on AWS S3 + CloudFront
* Host backend on AWS EC2
* Optional admin analytics dashboard using AWS QuickSight

---

# Tech Stack

## Frontend

* React
* React Router
* Tailwind CSS
* Framer Motion
* Lucide Icons

## Backend

* Flask
* Gunicorn
* Python
* pdfplumber
* pytesseract
* ReportLab
* SQLAlchemy
* boto3

## Machine Learning

* Scikit-learn
* Neural Network / Custom Model
* Fuzzy Logic Layer

## Cloud Services

* AWS EC2
* AWS S3
* AWS CloudFront
* AWS RDS PostgreSQL
* AWS QuickSight

---

# Project Structure

```text
project/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── server.py
│   ├── model.py
│   ├── uploads/
│   ├── generated_reports/
│   ├── requirements.txt
│   └── venv/
│
└── README.md
```

---

# Environment Variables

Create a `.env` file in the backend folder:

```env
S3_BUCKET=your-bucket-name
S3_REGION=ap-south-1
DATABASE_URL=postgresql+psycopg2://postgres:password@your-rds-endpoint:5432/diabetes_app
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

Then in `server.py` use:

```python
import os
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.getenv("S3_BUCKET")
S3_REGION = os.getenv("S3_REGION")
DATABASE_URL = os.getenv("DATABASE_URL")
```

---

# Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Install OCR dependencies:

Ubuntu:

```bash
sudo apt update
sudo apt install tesseract-ocr -y
```

Windows:

* Install Tesseract OCR
* Set path inside `server.py`

```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# Database Setup (AWS RDS PostgreSQL)

Connect to PostgreSQL:

```bash
psql -h your-rds-endpoint -U postgres -d diabetes_app
```

Create table:

```sql
CREATE TABLE patient_reports (
    id SERIAL PRIMARY KEY,
    filename TEXT,
    hba1c FLOAT,
    bmi FLOAT,
    age INT,
    tg FLOAT,
    urea FLOAT,
    prediction TEXT,
    confidence FLOAT,
    explanation TEXT,
    report_pdf TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

View records:

```sql
SELECT * FROM patient_reports ORDER BY created_at DESC;
```

---

# AWS S3 Setup

Create an S3 bucket.

Suggested folders:

```text
uploads/
reports/
```

Uploaded reports are stored in:

```text
uploads/<filename>
```

Generated PDF reports are stored in:

```text
reports/<filename>.pdf
```

---

# AWS RDS Security Group

Allow EC2 instance to access PostgreSQL:

Inbound Rule:

```text
Type: PostgreSQL
Port: 5432
Source: EC2 Security Group
```

---

# Running Backend in Production

Recommended Gunicorn command for 4GB EC2:

```bash
gunicorn \
  --workers 2 \
  --threads 2 \
  --worker-class gthread \
  --timeout 120 \
  --graceful-timeout 30 \
  --keep-alive 5 \
  --preload \
  -b 0.0.0.0:5000 \
  server:app > backend.log 2>&1 &
```

To stop Gunicorn:

```bash
pkill gunicorn
```

To see logs:

```bash
tail -f backend.log
```

---

# Model Preloading

To make predictions faster, preload the model in `server.py`:

```python
print("Preloading model...")

try:
    get_final_prediction(
        hba1c=6.0,
        bmi=25.0,
        age=40,
        tg=2.0,
        urea=5.0
    )
    print("Model loaded successfully")
except Exception as e:
    print("Model preload failed:", e)
```

---

# API Endpoints

## Upload Reports

```text
POST /upload-reports
```

Form-data:

```text
reports: file[]
```

Response:

```json
{
  "message": "Reports processed successfully",
  "uploaded_files": ["report.pdf"],
  "uploaded_urls": ["https://bucket.s3.amazonaws.com/uploads/file.pdf"],
  "extracted": {
    "HbA1c": 7.1,
    "BMI": 28.4,
    "AGE": 45,
    "TG": 2.3,
    "Urea": 5.2
  }
}
```

---

## Predict Diabetes Risk

```text
POST /predict
```

Request:

```json
{
  "HbA1c": 7.1,
  "BMI": 28.4,
  "AGE": 45,
  "TG": 2.3,
  "Urea": 5.2
}
```

Example Response:

```json
{
  "risk": "High Risk",
  "probability": 84,
  "explanation": "Patient has elevated HbA1c and BMI which increases diabetes risk.",
  "recommendations": [
    "Consult a doctor",
    "Exercise regularly",
    "Monitor blood sugar"
  ]
}
```

---

## Download Report

```text
POST /download-report
```

Returns:

```json
{
  "message": "Report generated successfully",
  "pdf_url": "https://bucket.s3.amazonaws.com/reports/report.pdf"
}
```

---

# Frontend API Configuration

```javascript
const API_BASE = "https://your-backend-domain.com";
```

Example:

```javascript
fetch(`${API_BASE}/predict`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
```

---

# Deploying Frontend to AWS

1. Build frontend:

```bash
npm run build
```

2. Upload `dist/` folder to S3 bucket
3. Enable static website hosting
4. Put CloudFront in front of S3 bucket
5. Use CloudFront URL for frontend

---

# Deploying Backend to AWS EC2

```bash
scp -r backend ubuntu@your-ec2-ip:/home/ubuntu/
ssh ubuntu@your-ec2-ip
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

Run backend using Gunicorn.

---

# HTTPS Backend Setup

Since frontend is hosted on HTTPS via CloudFront, backend must also support HTTPS.

Recommended options:

* Nginx + Let's Encrypt
* AWS Load Balancer + ACM Certificate

Example architecture:

```text
Browser -> HTTPS -> Nginx/Load Balancer -> Flask Gunicorn :5000
```

---

# QuickSight Admin Dashboard

Connect QuickSight to RDS table `patient_reports`.

Recommended dashboard widgets:

* Total patients analyzed
* High risk vs Low risk
* Average HbA1c
* Average BMI
* Recent predictions
* Download PDF links

Suggested SQL:

```sql
SELECT
    id,
    filename,
    hba1c,
    bmi,
    age,
    tg,
    urea,
    prediction,
    confidence,
    report_pdf,
    created_at
FROM patient_reports
ORDER BY created_at DESC;
```

---

# Troubleshooting

## Database Insert Not Working

Check backend logs:

```bash
tail -f backend.log
```

Make sure:

* RDS security group allows EC2
* Correct endpoint and password
* Table name is `patient_reports`

---

## Mixed Content Error

If frontend is HTTPS and backend is HTTP, browser blocks requests.

Fix by enabling HTTPS for backend.

---

## OCR Too Slow

Use:

```python
text = extract_pdf_text(save_path)

if not text.strip():
    text = extract_image_text(save_path)
```

This avoids unnecessary OCR on normal PDFs.

---

# Future Improvements

* Add user authentication
* Add admin login panel
* Replace pytesseract with AWS Textract
* Add email report sending using AWS SES
* Add alerts using AWS SNS
* Add charts and analytics in QuickSight
* Add patient history page

---

# Authors

Developed by Kshitij Desai.

Built using AI, OCR, Machine Learning, Flask, React, and AWS.
