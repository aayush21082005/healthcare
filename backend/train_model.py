from pathlib import Path
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "cleaned_patient_health.csv"
MODEL_PATH = BASE_DIR / "model.pkl"

FEATURES = [
    "Age",
    "Gender",
    "Demographics_Region",
    "Medical_History_Conditions",
    "Treatment_Plan_Medication",
    "Treatment_Plan_Therapy",
]
TARGET = "Patient_Outcome"


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()

    required = FEATURES + [TARGET]
    missing = [c for c in required if c not in df.columns]

    if missing:
        raise ValueError(f"Missing columns: {missing}")

    df = df[required].dropna()

    X = df[FEATURES]
    y = df[TARGET]

    categorical_features = [
        "Gender",
        "Demographics_Region",
        "Medical_History_Conditions",
        "Treatment_Plan_Medication",
        "Treatment_Plan_Therapy",
    ]

    numeric_features = ["Age"]

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ])

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(max_iter=2000, random_state=42)),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nMODEL EVALUATION")
    print("-" * 50)
    print(f"Accuracy : {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Retrain the final pipeline on the complete cleaned dataset.
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)

    print(f"\nFinal model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
