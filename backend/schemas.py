from pydantic import BaseModel
from typing import Optional


class PatientCreate(BaseModel):
    patient_id: str
    age: Optional[float] = None
    gender: Optional[str] = None
    demographics_region: Optional[str] = None
    medical_history_conditions: Optional[str] = None
    treatment_plan_medication: Optional[str] = None
    treatment_plan_therapy: Optional[str] = None


class PatientResponse(PatientCreate):
    id: int

    class Config:
        from_attributes = True


class PredictionRequest(BaseModel):
    patient_id: str
    age: float
    gender: str
    demographics_region: str
    medical_history_conditions: str
    treatment_plan_medication: str
    treatment_plan_therapy: str


class PredictionResponse(BaseModel):
    patient_id: str
    outcome: str
    probability: float
