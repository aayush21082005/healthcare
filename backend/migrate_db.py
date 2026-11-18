
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent / "healthcare.db"

connection = sqlite3.connect(str(db_path))
cursor = connection.cursor()

cursor.execute("PRAGMA table_info(patients)")
existing_columns = {
    row[1] for row in cursor.fetchall()
}

new_columns = {
    "demographics_region": "TEXT",
    "medical_history_conditions": "TEXT",
    "treatment_plan_medication": "TEXT",
    "treatment_plan_therapy": "TEXT",
}

for column, data_type in new_columns.items():
    if column not in existing_columns:
        cursor.execute(
            f"ALTER TABLE patients ADD COLUMN {column} {data_type}"
        )
        print(f"Added column: {column}")
    else:
        print(f"Already exists: {column}")

connection.commit()

cursor.execute("PRAGMA table_info(patients)")
print("\nCurrent patient table columns:")
for row in cursor.fetchall():
    print(row[1])

connection.close()

print("\nDatabase migration completed.")
print("Database:", db_path)
