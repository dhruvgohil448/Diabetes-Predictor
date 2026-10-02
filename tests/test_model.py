import pytest
import os
import sys

# Ensure backend directory is in sys.path
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from model import get_final_prediction, DiabetesMLNet


def test_model_initialization():
    """Verify that the ML neural network model loads properly without fuzzy logic."""
    net = DiabetesMLNet(input_size=5, hidden_size=16, output_size=3)
    assert net is not None
    # Verify fuzzy logic file is gone
    fuzzy_path = os.path.join(BASE_DIR, "fuzzy_logic.py")
    assert not os.path.exists(fuzzy_path), "fuzzy_logic.py should be removed"


def test_predict_diabetic():
    """Verify high-risk/diabetic prediction with ML model."""
    res = get_final_prediction(hba1c=8.5, bmi=33.0, age=55, tg=2.8, urea=6.5)
    assert "error" not in res
    assert res["prediction"] == "Diabetic"
    assert res["probability"] >= 70
    assert "fuzzy_score" not in res
    assert "fuzzy_result" not in res
    assert res["status"] in ["Confirmed", "Borderline/Check Manually"]
    assert len(res["precautions"]) > 0
    assert "HbA1c" in res["explanation"] or "glucose" in res["explanation"] or "elevation" in res["explanation"]
    assert res["details"]["predicted_class"] == "Y"
    assert "probabilities" in res["details"]
    assert res["details"]["probabilities"]["Diabetic"] > 90


def test_predict_healthy():
    """Verify healthy non-diabetic prediction with ML model."""
    res = get_final_prediction(hba1c=4.8, bmi=22.0, age=25, tg=1.0, urea=3.5)
    assert "error" not in res
    assert res["prediction"] == "Non-Diabetic"
    assert res["probability"] < 30
    assert "fuzzy_score" not in res
    assert "fuzzy_result" not in res
    assert len(res["precautions"]) > 0
    assert res["details"]["predicted_class"] == "N"
    assert res["details"]["probabilities"]["Non-Diabetic"] > 50


def test_predict_prediabetic():
    """Verify pre-diabetic prediction with ML model."""
    res = get_final_prediction(hba1c=5.9, bmi=26.5, age=45, tg=1.8, urea=4.8)
    assert "error" not in res
    assert res["prediction"] in ["Pre-Diabetic", "Diabetic"]
    assert "fuzzy_score" not in res
    assert res["details"]["predicted_class"] in ["P", "Y"]


def test_predict_invalid_inputs():
    """Verify error handling on invalid string input that cannot be cast to float."""
    res = get_final_prediction(hba1c="invalid", bmi=25, age=30, tg=1.5, urea=4.0)
    assert "error" in res
