import base64
import os
from io import BytesIO
from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(
    os.getenv("MODEL_PATH")
    or Path(__file__).resolve().parent / "model.pkl"
).expanduser()
_model_base64_path = os.getenv("MODEL_BASE64_PATH")
MODEL_BASE64_PATH = (
    Path(_model_base64_path).expanduser()
    if _model_base64_path
    else None
)

_model = None


def model_available():
    return MODEL_PATH.is_file() or (
        MODEL_BASE64_PATH is not None and MODEL_BASE64_PATH.is_file()
    )


def get_model():
    global _model

    if _model is None:
        if MODEL_BASE64_PATH is not None and MODEL_BASE64_PATH.is_file():
            encoded_model = MODEL_BASE64_PATH.read_text(encoding="ascii").strip()
            model_bytes = base64.b64decode(encoded_model, validate=True)
            _model = joblib.load(BytesIO(model_bytes))
        elif MODEL_PATH.is_file():
            _model = joblib.load(MODEL_PATH)
        else:
            raise FileNotFoundError(
                "Trained model file is missing. Configure MODEL_PATH."
            )

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
