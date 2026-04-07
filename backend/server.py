from flask import Flask, request, jsonify
from model import get_final_prediction
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 👈 ADD THIS LINE

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request. JSON payload is required."}), 400

        # 2. Define required keys (supporting frontend case variations)
        keys_required = {
            "hba1c": ["HbA1c", "hba1c"],
            "bmi": ["BMI", "bmi"],
            "age": ["AGE", "Age", "age"],
            "tg": ["TG", "tg"],
            "urea": ["Urea", "urea"]
        }
        
        extracted_features = {}
        missing_features = []

        # 3. Extract, validate, and convert to float
        for feature, possible_keys in keys_required.items():
            val = None
            for key in possible_keys:
                if key in data:
                    val = data[key]
                    break
            
            if val is None:
                missing_features.append(possible_keys[0])
            else:
                try:
                    extracted_features[feature] = float(val)
                except ValueError:
                    return jsonify({"error": f"Invalid data type for '{possible_keys[0]}'. Must be a numeric value."}), 400
        
        # Return error if any required fields are missing
        if missing_features:
            return jsonify({"error": f"Missing required numeric fields: {', '.join(missing_features)}"}), 400

        # 4. Call prediction logic from model.py
        result = get_final_prediction(
            hba1c=extracted_features["hba1c"],
            bmi=extracted_features["bmi"],
            age=extracted_features["age"],
            tg=extracted_features["tg"],
            urea=extracted_features["urea"]
        )

        print("Prediction result:", result)

        # 5. Handle model-level errors
        if "error" in result:
            return jsonify(result), 500

        # 6. Return successful response
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)