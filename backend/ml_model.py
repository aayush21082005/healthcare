import os
from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(
    os.getenv("MODEL_PATH")
    or Path(__file__).resolve().parent / "model.pkl"
).expanduser()

_model = None


def model_available():
    return MODEL_PATH.is_file()


def get_model():
    global _model

    if _model is None:
        if not model_available():
            raise FileNotFoundError(
                "Trained model file is missing. Configure MODEL_PATH."
            )
        _model = joblib.load(MODEL_PATH)

    return _model


def predict_patient_outcome(data):
    model = get_model()

    row = pd.DataFrame([{
        "Age": float(data["age"]),
        "Gender": data["gender"],
        "Demographics_Region": data["demographics_region"],
        "Medical_History_Conditions": data["medical_history_conditions"],
        "Treatment_Plan_Medication": data["treatment_plan_medication"],
        "Treatment_Plan_Therapy": data["treatment_plan_therapy"],
    }])

    prediction = model.predict(row)[0]
    probabilities = model.predict_proba(row)[0]

    classes = list(model.classes_)
    probability = float(probabilities[classes.index(prediction)] * 100)

    return {
        "outcome": str(prediction),
        "probability": round(probability, 2)
    }
