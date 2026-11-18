from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    age = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    demographics_region = Column(String, nullable=True)
    medical_history_conditions = Column(String, nullable=True)
    treatment_plan_medication = Column(String, nullable=True)
    treatment_plan_therapy = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    outcome = Column(String)
    probability = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
