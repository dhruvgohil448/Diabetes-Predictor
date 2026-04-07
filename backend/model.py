import torch
import torch.nn as nn
import joblib
import numpy as np
import os
from fuzzy_logic import OptimizedDiabetesFuzzy

# 1. THE BLUEPRINT (Required for PyTorch to load the saved model)
class NeuroFuzzyNet(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(NeuroFuzzyNet, self).__init__()
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
_fuzzy_engine = None

def _load_resources():
    global _model, _scaler, _le, _fuzzy_engine
    if _model is not None:
        return
        
    # Get the directory where model.py is located to find files automatically
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Define paths to your saved files
    model_path = os.path.join(base_path, 'diabetes_model.pth')
    scaler_path = os.path.join(base_path, 'scaler.pkl')
    encoder_path = os.path.join(base_path, 'label_encoder.pkl')

    # Load the Neuro model architecture and weights
    _model = NeuroFuzzyNet(input_size=5, hidden_size=16, output_size=3)
    _model.load_state_dict(torch.load(model_path, weights_only=True))
    _model.eval()
    
    # Load pre-processing tools (Scaler and Label Encoder)
    _scaler = joblib.load(scaler_path)
    _le = joblib.load(encoder_path)
    
    # Initialize fuzzy engine
    _fuzzy_engine = OptimizedDiabetesFuzzy()


# 2. THE PREDICTION FUNCTION WITH XAI
def get_final_prediction(hba1c, bmi, age, tg, urea):
    try:
        _load_resources()

        # 3. NEURO INFERENCE (The "Neuro" part)
        input_data = np.array([[hba1c, bmi, age, tg, urea]])
        input_scaled = _scaler.transform(input_data)
        input_t = torch.FloatTensor(input_scaled)

        with torch.no_grad():
            outputs = _model(input_t)
            probs = torch.softmax(outputs, dim=1)
            conf, pred_idx = torch.max(probs, 1)
            neuro_class = _le.inverse_transform([pred_idx.item()])[0]
            neuro_conf = round(conf.item() * 100, 2)

        # 4. FUZZY INFERENCE (The "Fuzzy" part)
        fuzzy_score = _fuzzy_engine.compute(hba1c, bmi, age, tg)
        
        # Map fuzzy score (0-10) to clinical classes
        if fuzzy_score < 3.5:
            fuzzy_class = "N"
        elif 3.5 <= fuzzy_score < 6.5:
            fuzzy_class = "P"
        else:
            fuzzy_class = "Y"

        # 5. EXPLAINABLE AI (XAI) LOGIC
        # This explains 'WHY' the system gave this result
        reasons = []
        if hba1c > 6.5:
            reasons.append("High HbA1c levels indicate long-term blood sugar elevation.")
        elif hba1c > 5.7:
            reasons.append("Borderline HbA1c suggests a risk of pre-diabetes.")
            
        if bmi > 30:
            reasons.append("BMI is in the Obese range, which is a major risk factor for insulin resistance.")
        
        if tg > 2.3:
            reasons.append("Elevated Triglycerides (TG) indicate metabolic stress.")

        explanation = " ".join(reasons) if reasons else "Biomarkers are generally within stable ranges."

        # 6. FINAL HYBRID MAPPING & STATUS
        mapping = {"N": "Non-Diabetic", "P": "Pre-Diabetic", "Y": "Diabetic"}
        
        # Check if Neuro and Fuzzy systems agree
        status = "Confirmed" if neuro_class == fuzzy_class else "Borderline/Check Manually"

        # 7. ACTIONABLE PRECAUTIONARY MEASURES
        disease_state = mapping[neuro_class]
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
            "confidence": f"{neuro_conf}%",
            "explanation": explanation,
            "precautions": precautions,
            "status": status,
            "fuzzy_score": round(float(fuzzy_score), 2),
            "details": {
                "neuro_result": neuro_class,
                "fuzzy_result": fuzzy_class
            }
        }

    except Exception as e:
        return {"error": f"Internal Error: {str(e)}"}

# --- TEST BLOCK (Commented out for Production/Web Use) ---
# if __name__ == "__main__":
#     # Test with sample data: HbA1c=8.2, BMI=33.0, Age=55, TG=2.8, Urea=6.5
#     res = get_final_prediction(hba1c=8.2, bmi=33.0, age=55, tg=2.8, urea=6.5)
#     print("\n--- FINAL HYBRID DIAGNOSIS WITH XAI ---")
#     print(f"Result: {res.get('prediction')}")
#     print(f"Confidence: {res.get('confidence')}")
#     print(f"Explanation: {res.get('explanation')}")
#     print(f"System Status: {res.get('status')}")