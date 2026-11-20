from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PatientCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    patient_id: str = Field(min_length=1, max_length=64)
    age: Optional[float] = Field(default=None, ge=0, le=130)
    gender: Optional[str] = Field(default=None, max_length=64)
    demographics_region: Optional[str] = Field(default=None, max_length=128)
    medical_history_conditions: Optional[str] = Field(default=None, max_length=512)
    treatment_plan_medication: Optional[str] = Field(default=None, max_length=256)
    treatment_plan_therapy: Optional[str] = Field(default=None, max_length=256)


class PatientResponse(PatientCreate):
    id: int
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    patient_id: str = Field(min_length=1, max_length=64)
    age: float = Field(ge=0, le=130)
    gender: str = Field(min_length=1, max_length=64)
    demographics_region: str = Field(min_length=1, max_length=128)
    medical_history_conditions: str = Field(min_length=1, max_length=512)
    treatment_plan_medication: str = Field(min_length=1, max_length=256)
    treatment_plan_therapy: str = Field(min_length=1, max_length=256)


class PredictionResponse(BaseModel):
    patient_id: str = Field(min_length=1, max_length=64)
    outcome: str = Field(min_length=1, max_length=256)
    probability: float = Field(ge=0, le=100)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=1, max_length=1024)
