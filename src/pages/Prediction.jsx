import { useState } from "react";
import { predictOutcome } from "../services/api";

function Prediction() {
  const [form, setForm] = useState({
    patient_id: "",
    age: "",
    gender: "",
    demographics_region: "",
    medical_history_conditions: "",
    treatment_plan_medication: "",
    treatment_plan_therapy: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError("");

    try {
      const data = await predictOutcome({
        ...form,
        age: Number(form.age),
      });

      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-heading">
        <h1>Patient Outcome Prediction</h1>
        <p>Generate an ML-based outcome prediction from patient attributes.</p>
      </div>

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

          <button className="primary-button" type="submit">Generate Prediction</button>
        </form>
      </div>

      {result && (
        <div className="content-card">
          <h2>Prediction Result</h2>
          <p><strong>Patient ID:</strong> {result.patient_id}</p>
          <p><strong>Predicted Outcome:</strong> {result.outcome}</p>
          <p><strong>Model Confidence:</strong> {result.probability}%</p>
        </div>
      )}
    </div>
  );
}

export default Prediction;
