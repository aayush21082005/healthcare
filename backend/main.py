
import logging
import os
from io import BytesIO
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import create_access_token, require_user
from database import Base, engine, get_db
from models import Patient, Prediction
from schemas import (
    LoginRequest,
    PatientCreate,
    PatientResponse,
    PredictionRequest,
    PredictionResponse,
)
from ml_model import model_available, predict_patient_outcome

load_dotenv(Path(__file__).resolve().parent / ".env")

logger = logging.getLogger(__name__)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_UPLOAD_ROWS = 10_000
SAFE_PREDICTION_ERROR_KEYS = {
    "age",
    "gender",
    "demographics_region",
    "medical_history_conditions",
    "treatment_plan_medication",
    "treatment_plan_therapy",
    "outcome",
    "probability",
}


# --------------------------------------------------
# APPLICATION SETUP
# --------------------------------------------------

app = FastAPI(
    title="Healthcare Patient Outcome Predictor API",
    version="1.0.0",
    description="Patient management, ML predictions and analytics API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

Base.metadata.create_all(bind=engine)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )
    if request.url.path not in {"/", "/health"}:
        response.headers["Cache-Control"] = "no-store"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response


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
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error(
            "Health check database query failed (%s)",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable.",
        ) from exc

    return {
        "api": "online",
        "database": "connected",
        "ml_model_available": model_available(),
    }


# --------------------------------------------------
# AUTHENTICATION
# --------------------------------------------------

@app.post("/auth/login")
def login(credentials: LoginRequest):
    token = create_access_token(credentials.username, credentials.password)
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": credentials.username,
    }


@app.get("/auth/me")
def current_user(username: str = Depends(require_user)):
    return {"username": username}


# --------------------------------------------------
# CREATE PATIENT
# --------------------------------------------------

@app.post("/patients", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    _username: str = Depends(require_user),
):
    patient_id = patient.patient_id

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

    except Exception as exc:
        db.rollback()
        logger.error("Unable to save patient record (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=500,
            detail="Unable to save patient. Check backend logs.",
        )


# --------------------------------------------------
# GET ALL PATIENTS
# --------------------------------------------------

@app.get("/patients", response_model=list[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    _username: str = Depends(require_user),
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    return (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


# --------------------------------------------------
# GET ONE PATIENT
# --------------------------------------------------

@app.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    _username: str = Depends(require_user),
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
    _username: str = Depends(require_user),
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

    except Exception as exc:
        db.rollback()
        logger.error("Unable to delete patient record (%s)", type(exc).__name__)
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
    _username: str = Depends(require_user),
):
    failure_stage = "model inference"
    try:
        result = predict_patient_outcome(
            request.model_dump()
        )

        failure_stage = "saving prediction"
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
            detail="Trained model is unavailable. Check the backend MODEL_PATH.",
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        error_key = exc.args[0] if isinstance(exc, KeyError) and exc.args else None
        if isinstance(error_key, str) and error_key in SAFE_PREDICTION_ERROR_KEYS:
            logger.error(
                "Prediction failed during %s (KeyError: %s)",
                failure_stage,
                error_key,
            )
        else:
            logger.error(
                "Patient outcome prediction failed during %s (%s)",
                failure_stage,
                type(exc).__name__,
            )
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check ml_model.py and backend logs.",
        )


# --------------------------------------------------
# PREDICTION HISTORY
# --------------------------------------------------

@app.get("/predictions")
def get_predictions(
    db: Session = Depends(get_db),
    _username: str = Depends(require_user),
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    records = (
        db.query(Prediction)
        .order_by(Prediction.id.desc())
        .limit(limit)
        .offset(offset)
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
    _username: str = Depends(require_user),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:
        content = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail="CSV file exceeds the 5 MB upload limit.",
            )

        df = pd.read_csv(BytesIO(content), dtype={"Patient_ID": str})
        df.columns = df.columns.str.strip()
        if df.columns.duplicated().any():
            raise HTTPException(
                status_code=400,
                detail="CSV contains duplicate column names.",
            )
        if len(df) > MAX_UPLOAD_ROWS:
            raise HTTPException(
                status_code=413,
                detail="CSV exceeds the 10,000 row limit.",
            )

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

        rows = df.to_dict(orient="records")
        candidates = []
        seen_ids = set()
        skipped = 0
        for row in rows:
            raw_id = row["Patient_ID"]
            if pd.isna(raw_id):
                skipped += 1
                continue

            patient_id = str(raw_id).strip()
            if not patient_id or len(patient_id) > 64 or patient_id in seen_ids:
                skipped += 1
                continue

            seen_ids.add(patient_id)
            age = pd.to_numeric(row["Age"], errors="coerce")
            age_value = float(age) if pd.notna(age) else None
            if age_value is not None and not 0 <= age_value <= 130:
                age_value = None

            candidates.append(
                Patient(
                    patient_id=patient_id,
                    age=age_value,
                    gender=_csv_value(row["Gender"], 64),
                    demographics_region=_csv_value(
                        row["Demographics_Region"], 128
                    ),
                    medical_history_conditions=_csv_value(
                        row["Medical_History_Conditions"], 512
                    ),
                    treatment_plan_medication=_csv_value(
                        row["Treatment_Plan_Medication"], 256
                    ),
                    treatment_plan_therapy=_csv_value(
                        row["Treatment_Plan_Therapy"], 256
                    ),
                )
            )

        patient_ids = [patient.patient_id for patient in candidates]
        existing_ids = set()
        for start in range(0, len(patient_ids), 500):
            batch = patient_ids[start:start + 500]
            existing_ids.update(
                row[0]
                for row in (
                    db.query(Patient.patient_id)
                    .filter(Patient.patient_id.in_(batch))
                    .all()
                )
            )

        new_patients = [
            patient for patient in candidates
            if patient.patient_id not in existing_ids
        ]
        skipped += len(candidates) - len(new_patients)

        db.add_all(new_patients)
        db.commit()

        return {
            "message": "CSV processed successfully",
            "records_added": len(new_patients),
            "records_skipped": skipped,
            "total_rows": len(df),
        }

    except HTTPException:
        db.rollback()
        raise

    except (pd.errors.ParserError, UnicodeDecodeError, ValueError):
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="CSV could not be parsed. Check the file format and values.",
        )

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="CSV contains patient IDs that conflict with saved records.",
        )

    except Exception as exc:
        db.rollback()
        logger.error("CSV import failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=500,
            detail="CSV import failed. Check backend logs.",
        )


# --------------------------------------------------
# DASHBOARD ANALYTICS
# --------------------------------------------------


@app.get("/analytics")
def analytics(
    db: Session = Depends(get_db),
    _username: str = Depends(require_user),
):
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    outcome_counts = {
        outcome or "Unknown": count
        for outcome, count in (
            db.query(Prediction.outcome, func.count(Prediction.id))
            .group_by(Prediction.outcome)
            .all()
        )
    }
    region_counts = {
        region or "Unknown": count
        for region, count in (
            db.query(Patient.demographics_region, func.count(Patient.id))
            .group_by(Patient.demographics_region)
            .all()
        )
    }
    department_counts = {"General": total_patients} if total_patients else {}

    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "outcome_distribution": outcome_counts,
        "region_distribution": region_counts,
        "department_distribution": department_counts,
    }


def _csv_value(value, max_length):
    if pd.isna(value):
        return None
    cleaned = str(value).strip()
    if len(cleaned) > max_length:
        raise HTTPException(
            status_code=400,
            detail="A CSV field exceeds the supported length.",
        )
    return cleaned or None
