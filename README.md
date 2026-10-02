# Diabetes Predictor

An intelligent, production-ready healthcare web application that predicts patient diabetes risk using a trained **Deep Neural Network Machine Learning Model**, automated **Medical Document OCR Analysis**, **Explainable AI (XAI)** clinical interpretation, and **100% Local Data Storage** with zero cloud or AWS dependencies.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture & Workflow](#architecture--workflow)
- [Tech Stack](#tech-stack)
- [How It Works (End-to-End Pipeline)](#how-it-works-end-to-end-pipeline)
- [Machine Learning Algorithm & Model Architecture](#machine-learning-algorithm--model-architecture)
  - [Algorithm Type](#algorithm-type)
  - [Neural Network Architecture](#neural-network-architecture)
  - [Input Clinical Biomarkers](#input-clinical-biomarkers)
  - [Target Output Classes](#target-output-classes)
  - [Clinical Thresholds & Decision Rules](#clinical-thresholds--decision-rules)
  - [Explainable AI (XAI) Engine](#explainable-ai-xai-engine)
- [Project Directory Structure](#project-directory-structure)
- [Local Installation & Setup](#local-installation--setup)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Local Database (SQLite)](#local-database-sqlite)
- [API Reference](#api-reference)
- [Automated Testing](#automated-testing)
- [Medical Disclaimer](#medical-disclaimer)

---

## Overview

Diabetes is one of the leading causes of chronic health complications worldwide. Early identification of pre-diabetic and diabetic states significantly improves clinical outcomes through lifestyle interventions and targeted medical management.

**Diabetes Predictor** provides a clinical-grade decision support platform that allows users to:
1. Upload existing lab reports (scanned PDFs, digital PDFs, or images) to automatically extract key medical biomarkers using optical character recognition (OCR).
2. Predict the risk of diabetes (`Non-Diabetic`, `Pre-Diabetic`, `Diabetic`) using an optimized PyTorch Multi-Layer Perceptron (MLP) neural network.
3. Receive transparent, interpretable clinical explanations (XAI) detailing how each biomarker contributed to the prediction.
4. Download a structured, professional clinical diagnostic PDF report.
5. Retain 100% data ownership: all patient records, uploaded files, and generated reports are stored locally in an SQLite database and local filesystem without any third-party cloud or AWS dependencies.

---

## Key Features

- **Automated Medical OCR Pipeline**: High-accuracy text and scanned-page extraction using `pdfplumber` and `Tesseract OCR`, capable of parsing both digitally generated and scanned image PDFs.
- **Biomarker Normalization & Standard Estimation**: Automatic unit conversion ($\text{mg/dL} \leftrightarrow \text{mmol/L}$) and ADA-standard estimated Average Glucose (eAG) to HbA1c conversion when direct tests are absent.
- **Deep Neural Network Classifier**: PyTorch-based Multi-Layer Perceptron with Batch Normalization, LeakyReLU, and Dropout regularization.
- **Explainable AI (XAI)**: Contextual medical rationale that breaks down HbA1c, BMI, Triglycerides, Urea, and Age risk contributions into human-readable language.
- **Tailored Clinical Precautions**: Dynamic medical precautions and lifestyle recommendations based on the predicted risk class.
- **100% Localhost & Zero Cloud**: Completely decoupled from AWS (no S3, no RDS, no EC2). All data resides in `backend/diabetes_app.db` and local file directories.
- **Automated PDF Report Generation**: Diagnostic report generated on-the-fly using ReportLab, complete with metrics, risk categories, and doctor sign-off blocks.

---

## Architecture & Workflow

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLIENT                                    |
|              React 18 Single-Page Application (Tailwind CSS + Recharts)           |
+----------------------------------------+------------------------------------------+
                                         |
                       HTTP / REST API   |   Port 5001 (Localhost)
                                         v
+-----------------------------------------------------------------------------------+
|                               FLASK BACKEND ENGINE                                |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  |   OCR Controller   |   |   Prediction Engine   |   |  PDF & Storage Engine  |  |
|  |                    |   |                       |   |                        |  |
|  |  * pdfplumber      |   |  * PyTorch MLP Net    |   |  * ReportLab Canvas    |  |
|  |  * Tesseract OCR   |   |  * Scikit-Learn Scaler|   |  * SQLite DB Manager   |  |
|  |  * Regex Extractors|   |  * XAI Clinical Logic |   |  * Local File Storage  |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
+------------|--------------------------|---------------------------|---------------+
             |                          |                           |
             v                          v                           v
     +---------------+          +---------------+           +---------------+
     | Uploaded PDFs |          | PyTorch Model |           | Local SQLite  |
     |  and Images   |          |  weights.pth  |           |  Database     |
     | (Local Disk)  |          |  scaler.pkl   |           | diabetes_app.db|
     +---------------+          +---------------+           +---------------+
```

---

## Tech Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Build Tool**: Craco / Webpack

### Backend
- **Framework**: [Flask](https://flask.palletsprojects.com/) (Python 3.9+)
- **Cross-Origin Handling**: Flask-CORS
- **Machine Learning**: [PyTorch](https://pytorch.org/) (`torch`, `torch.nn`)
- **Data Preprocessing**: [Scikit-Learn](https://scikit-learn.org/) (`MinMaxScaler`, `LabelEncoder`), `joblib`, `numpy`
- **OCR & Document Processing**: `pdfplumber`, `pytesseract` (Google Tesseract OCR Engine), `Pillow` (PIL)
- **PDF Generation**: `ReportLab`
- **Database**: SQLite3 (`sqlite3` / SQLAlchemy)
- **Testing**: `pytest`, `requests`

---

## How It Works (End-to-End Pipeline)

```
[ Upload Lab PDF / Image ]
            │
            ▼
[ OCR & Image Rasterization ] ──► Extracts: Age, HbA1c / Glucose, TG, BMI, Urea
            │
            ▼
[ Form Auto-Population ] ───────► User verifies or enters clinical parameters
            │
            ▼
[ Feature Normalization ] ──────► MinMaxScaler transforms inputs to [0, 1]
            │
            ▼
[ PyTorch Neural Network ] ─────► Deep MLP forward pass + Softmax
            │
            ▼
[ Prediction & XAI Engine ] ────► Multi-Class Probabilities + Clinical Explanations
            │
            ▼
[ SQLite & Report Generator ] ──► Record saved locally & PDF report downloaded
```

1. **Document Upload & OCR Preprocessing**:
   - The user uploads a lab report (`.pdf`, `.png`, `.jpg`, `.jpeg`).
   - For PDFs, `pdfplumber` first attempts native character stream extraction.
   - If the PDF is scanned (raster images without an embedded text layer), the page is rendered to a high-resolution PIL image (`200 DPI`) and processed with Google Tesseract OCR.
   - Text is analyzed using regular expressions with clinical terminology mapping to extract **Age**, **Triglycerides (TG)**, **Glucose / HbA1c**, **Urea**, and **BMI**.
   - If only Fasting or Post-Prandial Glucose is present, HbA1c is estimated using the **American Diabetes Association (ADA) eAG Equation**:
     $$\text{HbA1c} = \frac{\text{Glucose (mg/dL)} + 46.7}{28.7}$$
   - Triglycerides in $\text{mg/dL}$ are automatically converted to standard $\text{mmol/L}$ ($\text{mg/dL} \div 88.57$).

2. **Parameter Validation & Form Submission**:
   - Extracted biomarkers populate the interactive form for user review or manual adjustment.

3. **Feature Scaling**:
   - The five inputs are transformed into a normalized feature vector using a pre-fitted Scikit-Learn `MinMaxScaler`:
     $$\mathbf{x}_{\text{norm}} = \frac{\mathbf{x} - \mathbf{x}_{\min}}{\mathbf{x}_{\max} - \mathbf{x}_{\min}}$$

4. **Deep Neural Network Forward Pass**:
   - The normalized vector is evaluated by `DiabetesMLNet`, generating unnormalized logits that pass through a Softmax activation to yield class probabilities for `Non-Diabetic`, `Pre-Diabetic`, and `Diabetic`.

5. **Explainable AI (XAI) & Clinical Guidance**:
   - The system assesses which biomarkers deviate from healthy clinical thresholds (e.g., $\text{HbA1c} \ge 6.5\%$, $\text{BMI} \ge 30$, $\text{TG} \ge 2.3\,\text{mmol/L}$, $\text{Age} \ge 45$) and constructs an easy-to-understand explanation alongside actionable precautions.

6. **Local Persistence & PDF Export**:
   - The prediction, probabilities, explanation, and biomarker values are committed to the local SQLite database (`backend/diabetes_app.db`).
   - A clinical PDF report is dynamically compiled and served as a direct download.

---

## Machine Learning Algorithm & Model Architecture

### Algorithm Type
The core predictive algorithm is a **Deep Multi-Layer Perceptron (MLP)** — a feedforward artificial neural network trained on clinical diabetes diagnostic records.

The network incorporates **Batch Normalization** to stabilize training dynamics and accelerate convergence, **LeakyReLU** activations to prevent dying neuron states, and **Dropout** regularization to prevent overfitting on clinical training subsets.

### Neural Network Architecture

```
Input Vector (5 features: AGE, BMI, HbA1c, TG, Urea)
                  │
                  ▼
  [ Linear Layer: 5 -> 64 neurons ]
  [ Batch Normalization (BatchNorm1d) ]
  [ LeakyReLU Activation (alpha=0.01) ]
  [ Dropout (rate=0.2) ]
                  │
                  ▼
  [ Linear Layer: 64 -> 32 neurons ]
  [ Batch Normalization (BatchNorm1d) ]
  [ LeakyReLU Activation (alpha=0.01) ]
  [ Dropout (rate=0.2) ]
                  │
                  ▼
  [ Linear Layer: 32 -> 16 neurons ]
  [ ReLU Activation ]
                  │
                  ▼
  [ Linear Layer: 16 -> 3 neurons (Logits) ]
                  │
                  ▼
  [ Softmax Activation Function ]
                  │
                  ▼
Output Probabilities [ P(Non-Diabetic), P(Pre-Diabetic), P(Diabetic) ]
```

#### Layer-by-Layer Specifications:

| Layer | Type | In Features | Out Features | Activation / Regularization |
| :--- | :--- | :--- | :--- | :--- |
| **Input** | Feature Vector | - | 5 | Scaled $[0, 1]$ via `MinMaxScaler` |
| **Layer 1** | Linear (Dense) | 5 | 64 | `BatchNorm1d` + `LeakyReLU(0.01)` + `Dropout(0.2)` |
| **Layer 2** | Linear (Dense) | 64 | 32 | `BatchNorm1d` + `LeakyReLU(0.01)` + `Dropout(0.2)` |
| **Layer 3** | Linear (Dense) | 32 | 16 | `ReLU` |
| **Output** | Linear (Dense) | 16 | 3 | `Softmax` ($\sum p_i = 1$) |

### Input Clinical Biomarkers

The model consumes five primary diagnostic predictors:

1. **`HbA1c`** (Glycated Hemoglobin, %): Gold-standard measure of average blood sugar over the preceding 2–3 months.
2. **`BMI`** (Body Mass Index, $\text{kg/m}^2$): Ratio of weight to height squared; key indicator of adiposity and insulin resistance.
3. **`AGE`** (Age, Years): Demographic risk factor; susceptibility increases significantly after age 45.
4. **`TG`** (Triglycerides, $\text{mmol/L}$): Blood lipid biomarker reflecting dyslipidemia and metabolic syndrome.
5. **`Urea`** (Blood Urea Nitrogen, $\text{mmol/L}$): Indicator of renal metabolic clearance.

### Target Output Classes

| Class Code | Diagnosis | Clinical Description |
| :--- | :--- | :--- |
| **`N`** | **Non-Diabetic** | Biomarkers within normal physiological reference ranges. |
| **`P`** | **Pre-Diabetic** | Impaired glucose regulation; high risk of progression without intervention. |
| **`Y`** | **Diabetic** | Chronic hyperglycemia confirming Type 2 Diabetes Mellitus. |

### Clinical Thresholds & Decision Rules

The model and XAI engine evaluate predictions against established clinical standards (American Diabetes Association & WHO):

| Biomarker | Healthy / Normal | Pre-Diabetic / Borderline | High / Diabetic |
| :--- | :--- | :--- | :--- |
| **HbA1c** | $< 5.7\%$ | $5.7\% - 6.4\%$ | $\ge 6.5\%$ |
| **BMI** | $18.5 - 24.9$ | $25.0 - 29.9$ (Overweight) | $\ge 30.0$ (Obese) |
| **Triglycerides (TG)**| $< 1.7\,\text{mmol/L}$ | $1.7 - 2.29\,\text{mmol/L}$ | $\ge 2.3\,\text{mmol/L}$ |
| **Urea** | $2.5 - 7.1\,\text{mmol/L}$ | - | $> 7.1\,\text{mmol/L}$ |
| **Age** | $< 45$ years | - | $\ge 45$ years |

### Explainable AI (XAI) Engine

Rather than acting as an opaque black box, the system cross-references the neural network's winning class with individual biomarker deviations:
- **HbA1c Elevation**: Explains chronic glycemic exposure and microvascular risk.
- **Obesity / BMI**: Attributes insulin resistance risk based on WHO classification (Overweight vs. Class I/II Obese).
- **Hypertriglyceridemia**: Details cardiovascular risk and metabolic syndrome linkages.
- **Age Multiplier**: Quantifies age-related metabolic deceleration.

---

## Project Directory Structure

```text
diabetes_predictor/
│
├── frontend/                          # React Single-Page Application
│   ├── public/
│   │   ├── index.html                 # HTML title: "Diabetes Predictor"
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js              # Header with "Diabetes Predictor" branding
│   │   ├── pages/
│   │   │   ├── Home.js                # Landing page & feature showcase
│   │   │   ├── PatientForm.js         # Report upload & clinical input form
│   │   │   └── Result.js              # Prediction results, probability charts & XAI
│   │   ├── App.js                     # Routes & notification providers
│   │   └── index.css                  # Tailwind styles
│   ├── .env                           # Local API base configuration
│   └── package.json                   # Frontend dependencies
│
├── backend/                           # Flask Python Backend API
│   ├── server.py                      # REST endpoints, OCR processing, SQLite storage
│   ├── model.py                       # PyTorch DiabetesMLNet model & XAI reasoning
│   ├── diabetes_model.pth             # Trained PyTorch neural network weights
│   ├── scaler.pkl                     # Scikit-Learn feature MinMaxScaler
│   ├── label_encoder.pkl              # Target class LabelEncoder
│   ├── diabetes_app.db                # Local SQLite database
│   ├── uploads/                       # Local directory for uploaded user lab reports
│   ├── generated_reports/             # Local directory for generated diagnostic PDFs
│   └── requirements.txt               # Backend dependencies (pure ML, no AWS)
│
├── tests/                             # Automated Test Suites
│   ├── test_model.py                  # Unit tests for ML inference & feature scaling
│   └── test_server.py                 # Integration tests for Flask endpoints & DB
│
├── .gitignore                         # Git exclusion rules
└── README.md                          # Project documentation
```

---

## Local Installation & Setup

### Prerequisites

Ensure you have installed:
- **Python 3.9+**
- **Node.js 18+** and **npm**
- **Tesseract OCR**:
  - **macOS**: `brew install tesseract`
  - **Ubuntu / Debian**: `sudo apt update && sudo apt install tesseract-ocr -y`
  - **Windows**: Download installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH.

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows:
# .\venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Start the Flask API server
PORT=5001 python server.py
```

The backend server starts on: **`http://127.0.0.1:5001`**

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies
npm install --legacy-peer-deps

# Start the React development server
npm start
```

The application will open automatically at: **`http://localhost:3000`**

---

## Local Database (SQLite)

All patient risk evaluations and diagnostic reports are persisted locally in SQLite at `backend/diabetes_app.db`.

### Database Schema

```sql
CREATE TABLE patient_reports (
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
```

You can query stored records anytime via the endpoint:
```bash
curl http://127.0.0.1:5001/patient-reports
```

---

## API Reference

### 1. Health Check
- **Endpoint**: `GET /health`
- **Description**: Verifies backend server health and local configurations.
- **Response**:
```json
{
  "model": "neural-network-ml",
  "service": "diabetes-predictor",
  "status": "ok",
  "storage": "local-sqlite"
}
```

---

### 2. Upload Lab Report & OCR Extraction
- **Endpoint**: `POST /upload-reports`
- **Content-Type**: `multipart/form-data`
- **Body**: `reports: <file.pdf | file.png | file.jpg>`
- **Response**:
```json
{
  "extracted": {
    "AGE": 45,
    "BMI": 24.5,
    "HbA1c": 6.5,
    "TG": 2.06,
    "Urea": 4.5
  },
  "message": "Reports processed successfully",
  "uploaded_files": ["Diabetes-report.pdf"],
  "uploaded_urls": ["http://127.0.0.1:5001/uploads/fc8f1c95234f49dc8f30699815dbd4b7_Diabetes-report.pdf"]
}
```

---

### 3. Predict Diabetes Risk
- **Endpoint**: `POST /predict`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "AGE": 55,
  "BMI": 31.4,
  "HbA1c": 7.8,
  "TG": 2.4,
  "Urea": 5.2
}
```
- **Response**:
```json
{
  "confidence": "99%",
  "details": {
    "model_confidence": "99.2%",
    "predicted_class": "Y",
    "probabilities": {
      "Diabetic": 99.2,
      "Non-Diabetic": 0.1,
      "Pre-Diabetic": 0.7
    }
  },
  "explanation": "High HbA1c levels (≥ 6.5%) indicate long-term chronic blood sugar elevation. BMI is in the Obese range (≥ 30), which is a primary clinical risk factor for insulin resistance. Elevated Triglycerides (TG ≥ 2.3 mmol/L) reflect lipid and metabolic stress. Patient age (≥ 45) correlates with heightened clinical susceptibility.",
  "precautions": [
    "Consult an endocrinologist or healthcare provider for medical evaluation.",
    "Strictly monitor your daily blood sugar levels.",
    "Adopt a medically supervised low-glycemic diet.",
    "Engage in daily physical activity as recommended by your doctor."
  ],
  "prediction": "Diabetic",
  "probability": 99,
  "status": "Confirmed"
}
```

---

### 4. Download Diagnostic PDF Report
- **Endpoint**: `POST /download-report`
- **Content-Type**: `application/json`
- **Request Body**: Complete prediction object (values, prediction, explanation).
- **Response**: Direct PDF binary attachment (`application/pdf`) and auto-saves to `backend/generated_reports/`.

---

### 5. Fetch Patient History
- **Endpoint**: `GET /patient-reports`
- **Response**: Array of all stored patient assessments in the SQLite database.

---

## Automated Testing

The project includes unit and integration tests covering the ML neural network, OCR extraction, SQLite operations, and API endpoints.

```bash
# Run pytest with virtual environment
./backend/venv/bin/pytest tests/ -v
```

Expected output:
```text
tests/test_model.py::TestDiabetesModel::test_model_instantiation PASSED
tests/test_model.py::TestDiabetesModel::test_diabetic_prediction PASSED
tests/test_model.py::TestDiabetesModel::test_healthy_prediction PASSED
tests/test_model.py::TestDiabetesModel::test_prediabetic_prediction PASSED
tests/test_model.py::TestDiabetesModel::test_explanation_generation PASSED
tests/test_server.py::TestFlaskServer::test_health_endpoint PASSED
tests/test_server.py::TestFlaskServer::test_predict_endpoint_diabetic PASSED
tests/test_server.py::TestFlaskServer::test_predict_endpoint_healthy PASSED
tests/test_server.py::TestFlaskServer::test_predict_endpoint_missing_fields PASSED
tests/test_server.py::TestFlaskServer::test_upload_report_and_extraction PASSED
tests/test_server.py::TestFlaskServer::test_sqlite_persistence PASSED
tests/test_server.py::TestFlaskServer::test_download_report_pdf PASSED
tests/test_server.py::TestFlaskServer::test_serve_uploaded_file PASSED
tests/test_server.py::TestFlaskServer::test_serve_generated_report PASSED
tests/test_server.py::TestFlaskServer::test_patient_reports_endpoint PASSED

============================== 15 passed in 5.8s ==============================
```

---

## Medical Disclaimer

> **Important**: This software is intended solely for academic, research, and educational demonstration purposes. It does **not** provide professional medical advice, diagnosis, or treatment. Always seek the advice of a physician or qualified healthcare provider regarding any medical condition.
