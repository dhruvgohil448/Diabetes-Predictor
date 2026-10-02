import torch
import torch.nn as nn
import joblib
import numpy as np
import os

# 1. THE BLUEPRINT (Required for PyTorch to load the saved model)
class DiabetesMLNet(nn.Module):
    def __init__(self, input_size=5, hidden_size=16, output_size=3):
        super(DiabetesMLNet, self).__init__()
        # Attribute names match the trained weights state dict
        self.fuzzification = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.rules = nn.Linear(hidden_size, hidden_size)
        self.output = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x = self.relu(self.fuzzification(x))
        x = self.relu(self.rules(x))
        x = self.output(x)
        return x

# GLOBAL RESOURCES TO AVOID RELOADING ON EVERY CALL
_model = None
_scaler = None
_le = None

def _load_resources():
    global _model, _scaler, _le
    if _model is not None:
        return
        
    # Get the directory where model.py is located to find files automatically
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Define paths to saved files
    model_path = os.path.join(base_path, 'diabetes_model.pth')
    scaler_path = os.path.join(base_path, 'scaler.pkl')
    encoder_path = os.path.join(base_path, 'label_encoder.pkl')

    # Load the ML neural network architecture and trained weights
    _model = DiabetesMLNet(input_size=5, hidden_size=16, output_size=3)
    _model.load_state_dict(torch.load(model_path, weights_only=True))
    _model.eval()
    
    # Load pre-processing tools (Scaler and Label Encoder)
    _scaler = joblib.load(scaler_path)
    _le = joblib.load(encoder_path)


# 2. THE ML PREDICTION FUNCTION WITH XAI (Explainable AI)
def get_final_prediction(hba1c, bmi, age, tg, urea):
    try:
        _load_resources()

        # 3. MACHINE LEARNING INFERENCE
        input_data = np.array([[float(hba1c), float(bmi), float(age), float(tg), float(urea)]])
        input_scaled = _scaler.transform(input_data)
        input_t = torch.FloatTensor(input_scaled)

        with torch.no_grad():
            outputs = _model(input_t)
            probs = torch.softmax(outputs, dim=1)[0]
            conf, pred_idx = torch.max(probs, 0)
            pred_class = _le.inverse_transform([pred_idx.item()])[0]
            class_conf = round(conf.item() * 100, 2)
            
            prob_N = float(probs[0].item())
            prob_P = float(probs[1].item())
            prob_Y = float(probs[2].item())

        # 4. CLINICAL MAPPING
        mapping = {"N": "Non-Diabetic", "P": "Pre-Diabetic", "Y": "Diabetic"}
        disease_state = mapping.get(pred_class, "Non-Diabetic")

        # 5. ML-BASED RISK SCORE CALCULATION (0 - 100%)
        # Directly derived from the ML model class probabilities
        if pred_class == "Y":
            risk_score = round(max(70.0, min(99.0, prob_Y * 100)), 1)
        elif pred_class == "P":
            risk_score = round(max(35.0, min(68.0, prob_P * 40 + prob_Y * 40 + 20.0)), 1)
        else: # "N"
            risk_score = round(max(5.0, min(28.0, (1.0 - prob_N) * 40.0 + prob_Y * 20.0 + 5.0)), 1)

        # 6. EXPLAINABLE AI (XAI) LOGIC
        reasons = []
        if hba1c >= 6.5:
            reasons.append("High HbA1c levels (≥ 6.5%) indicate long-term chronic blood sugar elevation.")
        elif hba1c >= 5.7:
            reasons.append("Borderline HbA1c (5.7–6.4%) suggests insulin resistance and risk of pre-diabetes.")
            
        if bmi >= 30:
            reasons.append("BMI is in the Obese range (≥ 30), which is a primary clinical risk factor for insulin resistance.")
        elif bmi >= 25:
            reasons.append("BMI is in the Overweight range (25–29.9), increasing metabolic strain.")
        
        if tg >= 2.3:
            reasons.append("Elevated Triglycerides (TG ≥ 2.3 mmol/L) reflect lipid and metabolic stress.")

        if urea >= 7.0:
            reasons.append("Elevated Urea (≥ 7.0 mmol/L) indicates biomarker stress on renal and metabolic pathways.")

        if age >= 45:
            reasons.append("Patient age (≥ 45) correlates with heightened clinical susceptibility.")

        explanation = " ".join(reasons) if reasons else "Biomarkers are generally within healthy stable ranges."

        # 7. CLINICAL STATUS
        status = "Confirmed" if class_conf >= 55 else "Borderline/Check Manually"

        # 8. ACTIONABLE PRECAUTIONARY MEASURES
        precautions = []
        if disease_state == "Diabetic":
            precautions = [
                "Consult an endocrinologist or healthcare provider for medical evaluation.",
                "Strictly monitor your daily blood sugar levels.",
                "Adopt a medically supervised low-glycemic diet.",
                "Engage in daily physical activity as recommended by your doctor."
            ]
        elif disease_state == "Pre-Diabetic":
            precautions = [
                "Schedule a follow-up with your doctor to discuss preventative steps.",
                "Reduce intake of processed sugars and simple carbohydrates.",
                "Incorporate at least 150 minutes of moderate cardiovascular exercise per week.",
                "Focus on weight management strategies if BMI is above the normal range."
            ]
        else: # Non-Diabetic
            precautions = [
                "Maintain your current healthy lifestyle and diet.",
                "Continue routine annual health and blood check-ups.",
                "Keep a balanced diet rich in whole foods and fiber.",
                "Stay physically active to preserve long-term insulin sensitivity."
            ]

        return {
            "prediction": disease_state,
            "confidence": f"{round(risk_score)}%",
            "probability": round(risk_score),
            "explanation": explanation,
            "precautions": precautions,
            "status": status,
            "details": {
                "predicted_class": pred_class,
                "model_confidence": f"{class_conf}%",
                "probabilities": {
                    "Non-Diabetic": round(prob_N * 100, 2),
                    "Pre-Diabetic": round(prob_P * 100, 2),
                    "Diabetic": round(prob_Y * 100, 2)
                }
            }
        }

    except Exception as e:
        return {"error": f"Internal Error: {str(e)}"}