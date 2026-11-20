import { useEffect, useState } from "react";
import { addPatient, getPatients } from "../services/api";
import DataTable from "../components/DataTable";

const PAGE_SIZE = 100;

function PatientData() {
  const [patients, setPatients] = useState([]);
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState({
    patient_id: "",
    age: "",
    gender: "",
    demographics_region: "",
    medical_history_conditions: "",
    treatment_plan_medication: "",
    treatment_plan_therapy: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPatients = async (targetOffset = offset) => {
    try {
      setError("");
      setPatients(await getPatients(targetOffset, PAGE_SIZE));
      setOffset(targetOffset);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await addPatient({
        ...form,
        age: form.age === "" ? null : Number(form.age),
      });

      setMessage("Patient saved successfully.");
      setOffset(0);
      setForm({
        patient_id: "",
        age: "",
        gender: "",
        demographics_region: "",
        medical_history_conditions: "",
        treatment_plan_medication: "",
        treatment_plan_therapy: "",
      });

      loadPatients(0);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: "patient_id", label: "Patient ID" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "demographics_region", label: "Region" },
    { key: "medical_history_conditions", label: "Medical History" },
    { key: "treatment_plan_medication", label: "Medication" },
    { key: "treatment_plan_therapy", label: "Therapy" },
  ];

  return (
    <div>
      <div className="page-heading">
        <h1>Patient Data</h1>
        <p>Add and manage patient records.</p>
      </div>

      {message && <div className="success-message" role="status">{message}</div>}
      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="content-card">
        <form className="patient-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="patient-id">Patient ID</label>
            <input id="patient-id" name="patient_id" value={form.patient_id} onChange={handleChange} maxLength={64} required />
          </div>

          <div className="form-field">
            <label htmlFor="patient-age">Age</label>
            <input id="patient-age" type="number" name="age" min="0" max="130" value={form.age} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label htmlFor="patient-gender">Gender</label>
            <select id="patient-gender" name="gender" value={form.gender} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="patient-region">Region</label>
            <select id="patient-region" name="demographics_region" value={form.demographics_region} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="urban">Urban</option>
              <option value="suburban">Suburban</option>
              <option value="rural">Rural</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="patient-history">Medical History</label>
            <select id="patient-history" name="medical_history_conditions" value={form.medical_history_conditions} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="Heart Disease">Heart Disease</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Asthma">Asthma</option>
              <option value="Hypertension">Hypertension</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="patient-medication">Medication</label>
            <select id="patient-medication" name="treatment_plan_medication" value={form.treatment_plan_medication} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="Metoprolol">Metoprolol</option>
              <option value="Metformin">Metformin</option>
              <option value="Fluticasone">Fluticasone</option>
              <option value="Atorvastatin">Atorvastatin</option>
              <option value="Insulin">Insulin</option>
              <option value="Amlodipine">Amlodipine</option>
              <option value="Losartan">Losartan</option>
              <option value="Glipizide">Glipizide</option>
              <option value="Lisinopril">Lisinopril</option>
              <option value="Albuterol">Albuterol</option>
              <option value="Aspirin">Aspirin</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="patient-therapy">Therapy</label>
            <select id="patient-therapy" name="treatment_plan_therapy" value={form.treatment_plan_therapy} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="Dietary Counseling">Dietary Counseling</option>
              <option value="Cognitive Behavioral Therapy">Cognitive Behavioral Therapy</option>
              <option value="Physical Therapy">Physical Therapy</option>
            </select>
          </div>

          <button className="primary-button" type="submit">Save Patient</button>
        </form>
      </div>

      <div className="content-card">
        <h2>Stored Patients</h2>
        <DataTable columns={columns} data={patients} />
        <nav className="pagination-controls" aria-label="Patient records pagination">
          <button
            className="secondary-button"
            disabled={offset === 0}
            onClick={() => loadPatients(Math.max(0, offset - PAGE_SIZE))}
            type="button"
          >
            Previous
          </button>
          <span aria-live="polite">
            Records {patients.length ? offset + 1 : 0} to {offset + patients.length}
          </span>
          <button
            className="secondary-button"
            disabled={patients.length < PAGE_SIZE}
            onClick={() => loadPatients(offset + PAGE_SIZE)}
            type="button"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}

export default PatientData;
