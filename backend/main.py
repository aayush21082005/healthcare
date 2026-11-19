
from pathlib import Path
from io import BytesIO
import os

import pandas as pd
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    Depends,
    File,
    UploadFile,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import Base, engine, get_db
from models import Patient, Prediction
from schemas import (
    PatientCreate,
    PatientResponse,
    PredictionRequest,
    PredictionResponse,
)
from ml_model import predict_patient_outcome

load_dotenv(Path(__file__).resolve().parent / ".env")


# --------------------------------------------------
# APPLICATION SETUP
# --------------------------------------------------

app = FastAPI(
    title="Healthcare Patient Outcome Predictor API",
    version="1.0.0",
    description="Patient management, ML predictions and analytics API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# ROOT AND HEALTH
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Healthcare Patient Outcome Predictor API",
        "status": "running",
    }


@app.get("/health")
def health(db: Session = Depends(get_db)):
    model_path = Path(__file__).resolve().parent / "model.pkl"

    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "error"

    return {
        "api": "online",
        "database": database_status,
        "ml_model_file": (
            "present" if model_path.exists() else "missing"
        ),
    }


# --------------------------------------------------
# CREATE PATIENT
# --------------------------------------------------

@app.post("/patients", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
):
    patient_id = patient.patient_id.strip()

    if not patient_id:
        raise HTTPException(
            status_code=422,
            detail="Patient ID cannot be empty.",
        )

    existing = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Patient ID already exists. Please use a unique ID.",
        )

    data = patient.model_dump()
    data["patient_id"] = patient_id
    new_patient = Patient(**data)

    try:
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        return new_patient

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Duplicate patient ID. Please use a unique ID.",
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save patient. Check backend logs.",
        )


# --------------------------------------------------
# GET ALL PATIENTS
# --------------------------------------------------

@app.get("/patients", response_model=list[PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    return (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .all()
    )


# --------------------------------------------------
# GET ONE PATIENT
# --------------------------------------------------

@app.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    return patient


# --------------------------------------------------
# DELETE PATIENT
# --------------------------------------------------

@app.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    try:
        db.delete(patient)
        db.commit()
        return {"message": "Patient deleted successfully"}

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete patient.",
        )


# --------------------------------------------------
# ML PREDICTION
# --------------------------------------------------

@app.post("/predict", response_model=PredictionResponse)
def predict(
    request: PredictionRequest,
    db: Session = Depends(get_db),
):
    try:
        result = predict_patient_outcome(
            request.model_dump()
        )

        prediction = Prediction(
            patient_id=request.patient_id,
            outcome=str(result["outcome"]),
            probability=float(result["probability"]),
        )

        db.add(prediction)
        db.commit()

        return {
            "patient_id": request.patient_id,
            "outcome": prediction.outcome,
            "probability": prediction.probability,
        }

    except FileNotFoundError:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Trained model file is missing. Check backend/model.pkl.",
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check ml_model.py and backend logs.",
        )


# --------------------------------------------------
# PREDICTION HISTORY
# --------------------------------------------------

@app.get("/predictions")
def get_predictions(db: Session = Depends(get_db)):
    records = (
        db.query(Prediction)
        .order_by(Prediction.id.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "patient_id": item.patient_id,
            "outcome": item.outcome,
            "probability": item.probability,
            "created_at": item.created_at,
        }
        for item in records
    ]


# --------------------------------------------------
# CSV UPLOAD
# --------------------------------------------------

@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:
        content = await file.read()
        df = pd.read_csv(BytesIO(content))
        df.columns = df.columns.str.strip()

        required_columns = [
            "Patient_ID",
            "Age",
            "Gender",
            "Demographics_Region",
            "Medical_History_Conditions",
            "Treatment_Plan_Medication",
            "Treatment_Plan_Therapy",
            "Patient_Outcome",
        ]

        missing = [
            column
            for column in required_columns
            if column not in df.columns
        ]

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing CSV columns: {', '.join(missing)}",
            )

        added = 0
        skipped = 0

        for _, row in df.iterrows():
            if pd.isna(row["Patient_ID"]):
                skipped += 1
                continue

            patient_id = str(row["Patient_ID"]).strip()

            if not patient_id:
                skipped += 1
                continue

            exists = (
                db.query(Patient)
                .filter(Patient.patient_id == patient_id)
                .first()
            )

            if exists:
                skipped += 1
                continue

            age = pd.to_numeric(row["Age"], errors="coerce")

            new_patient = Patient(
                patient_id=patient_id,
                age=float(age) if pd.notna(age) else None,
                gender=(
                    str(row["Gender"])
                    if pd.notna(row["Gender"]) else None
                ),
                demographics_region=(
                    str(row["Demographics_Region"])
                    if pd.notna(row["Demographics_Region"]) else None
                ),
                medical_history_conditions=(
                    str(row["Medical_History_Conditions"])
                    if pd.notna(row["Medical_History_Conditions"]) else None
                ),
                treatment_plan_medication=(
                    str(row["Treatment_Plan_Medication"])
                    if pd.notna(row["Treatment_Plan_Medication"]) else None
                ),
                treatment_plan_therapy=(
                    str(row["Treatment_Plan_Therapy"])
                    if pd.notna(row["Treatment_Plan_Therapy"]) else None
                ),
            )

            db.add(new_patient)
            added += 1

        db.commit()

        return {
            "message": "CSV processed successfully",
            "records_added": added,
            "records_skipped": skipped,
            "total_rows": len(df),
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="CSV processing failed. Check the CSV format and backend logs.",
        )


# --------------------------------------------------
# DASHBOARD ANALYTICS
# --------------------------------------------------


@app.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    predictions = db.query(Prediction).all()

    outcome_counts = {}
    region_counts = {}
    department_counts = {}

    for prediction in predictions:
        outcome = getattr(prediction, "outcome", None) or "Unknown"
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

    for patient in patients:
        region = getattr(patient, "demographics_region", None) or "Unknown"
        region_counts[region] = region_counts.get(region, 0) + 1

        department = getattr(patient, "department", None) or "General"
        department_counts[department] = (
            department_counts.get(department, 0) + 1
        )

    return {
        "total_patients": len(patients),
        "total_predictions": len(predictions),
        "outcome_distribution": outcome_counts,
        "region_distribution": region_counts,
        "department_distribution": department_counts
    }
