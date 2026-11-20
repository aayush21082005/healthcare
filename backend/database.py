from pathlib import Path
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    database_path = Path(__file__).resolve().parent / "healthcare.db"
    DATABASE_URL = f"sqlite:///{database_path}"

engine = create_engine(
    DATABASE_URL,
    poolclass=StaticPool if DATABASE_URL in {"sqlite://", "sqlite:///:memory:"} else None,
    connect_args=(
        {"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite:")
        else {}
    )
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
