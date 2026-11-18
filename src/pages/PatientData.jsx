import { useEffect, useState } from "react";
import { addPatient, deletePatient, getPatients } from "../services/api";
import DataTable from "../components/DataTable";

function PatientData() {
  const [patients, setPatients] = useState([]);
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

  const loadPatients = async () => {
    try {
      setPatients(await getPatients());
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
      setForm({
        patient_id: "",
        age: "",
        gender: "",
        demographics_region: "",
        medical_history_conditions: "",
        treatment_plan_medication: "",
        treatment_plan_therapy: "",
      });

      loadPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (patientId) => {
    try {
      await deletePatient(patientId);
      loadPatients();
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

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="content-card">
        <form className="patient-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Patient ID</label>
            <input name="patient_id" value={form.patient_id} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Age</label>
            <input type="number" name="age" value={form.age} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-field">
            <label>Region</label>
            <select name="demographics_region" value={form.demographics_region} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="urban">Urban</option>
              <option value="suburban">Suburban</option>
              <option value="rural">Rural</option>
            </select>
          </div>

          <div className="form-field">
            <label>Medical History</label>
            <select name="medical_history_conditions" value={form.medical_history_conditions} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="Heart Disease">Heart Disease</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Asthma">Asthma</option>
              <option value="Hypertension">Hypertension</option>
            </select>
          </div>

          <div className="form-field">
            <label>Medication</label>
            <select name="treatment_plan_medication" value={form.treatment_plan_medication} onChange={handleChange} required>
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
            <label>Therapy</label>
            <select name="treatment_plan_therapy" value={form.treatment_plan_therapy} onChange={handleChange} required>
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
      </div>
    </div>
  );
}

export default PatientData;
