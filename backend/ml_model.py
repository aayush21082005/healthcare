from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"

_model = None


def get_model():
    global _model

    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                "model.pkl not found. Run: python train_model.py"
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
