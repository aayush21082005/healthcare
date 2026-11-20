import base64

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import auth
import ml_model
from database import Base, get_db
from main import app


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "reviewer")
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", auth.hash_password("test-password"))
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-bytes-long")

    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def test_patient_and_analytics_routes_require_authentication(client):
    for path in ("/patients", "/predictions", "/analytics"):
        response = client.get(path)
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"


def test_login_token_can_access_patient_data_and_analytics(client):
    login_response = client.post(
        "/auth/login",
        json={"username": "reviewer", "password": "test-password"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    patient_response = client.post(
        "/patients",
        headers=headers,
        json={
            "patient_id": "P-100",
            "age": 45,
            "demographics_region": "urban",
        },
    )
    assert patient_response.status_code == 200

    analytics_response = client.get("/analytics", headers=headers)
    assert analytics_response.status_code == 200
    assert analytics_response.json()["total_patients"] == 1
    assert analytics_response.json()["region_distribution"] == {"urban": 1}


def test_login_rejects_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={"username": "reviewer", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_upload_rejects_files_over_size_limit(client):
    login_response = client.post(
        "/auth/login",
        json={"username": "reviewer", "password": "test-password"},
    )
    headers = {
        "Authorization": f"Bearer {login_response.json()['access_token']}"
    }

    response = client.post(
        "/upload",
        headers=headers,
        files={
            "file": (
                "patients.csv",
                b"x" * (5 * 1024 * 1024 + 1),
                "text/csv",
            )
        },
    )
    assert response.status_code == 413


def test_invalid_auth_configuration_fails_closed(client, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "short")

    response = client.post(
        "/auth/login",
        json={"username": "reviewer", "password": "test-password"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Authentication is not configured."


def test_health_reports_configured_model_file(client, monkeypatch, tmp_path):
    model_path = tmp_path / "model.pkl"
    monkeypatch.setattr(ml_model, "MODEL_PATH", model_path)
    monkeypatch.setattr(ml_model, "MODEL_BASE64_PATH", None)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["ml_model_available"] is False

    model_path.touch()

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["ml_model_available"] is True


def test_model_loader_decodes_base64_secret_file(monkeypatch, tmp_path):
    model_bytes = b"serialized-model"
    model_path = tmp_path / "model.pkl.b64"
    model_path.write_text(base64.b64encode(model_bytes).decode("ascii"))
    loaded_model = object()

    def load_model(model_source):
        assert model_source.read() == model_bytes
        return loaded_model

    monkeypatch.setattr(ml_model, "MODEL_PATH", tmp_path / "missing.pkl")
    monkeypatch.setattr(ml_model, "MODEL_BASE64_PATH", model_path)
    monkeypatch.setattr(ml_model, "_model", None)
    monkeypatch.setattr(ml_model.joblib, "load", load_model)

    assert ml_model.get_model() is loaded_model
