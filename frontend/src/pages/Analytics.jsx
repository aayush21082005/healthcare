
import { useEffect, useState } from "react";
import { getAnalytics } from "../services/api";

function BarChart({ title, data, colorClass = "bar-blue" }) {
  const entries = Object.entries(data || {});
  const maxValue = Math.max(...entries.map(([, value]) => Number(value) || 0), 1);

  return (
    <section className="analytics-card">
      <h2>{title}</h2>

      {entries.length === 0 ? (
        <p className="analytics-empty">
          No records available yet. Add patient data or generate predictions.
        </p>
      ) : (
        <div className="analytics-bars">
          {entries.map(([label, value]) => {
            const count = Number(value) || 0;
            const width = (count / maxValue) * 100;

            return (
              <div className="analytics-bar-row" key={label}>
                <div className="analytics-bar-heading">
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>

                <div className="analytics-bar-track">
                  <div
                    className={`analytics-bar-fill ${colorClass}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");
      const result = await getAnalytics();
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return <main className="analytics-page"><p>Loading analytics...</p></main>;
  }

  if (error) {
    return (
      <main className="analytics-page">
        <h1>Healthcare Analytics</h1>
        <div className="analytics-error">{error}</div>
        <button className="analytics-refresh" onClick={loadAnalytics}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="analytics-page">
      <div className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">HEALTHCARE INSIGHTS</p>
          <h1>Analytics Overview</h1>
          <p>Patient records and prediction distribution.</p>
        </div>

        <button className="analytics-refresh" onClick={loadAnalytics}>
          Refresh Data
        </button>
      </div>

      <div className="analytics-stats">
        <article className="analytics-stat">
          <span>Total Patients</span>
          <strong>{data?.total_patients ?? 0}</strong>
        </article>

        <article className="analytics-stat">
          <span>Total Predictions</span>
          <strong>{data?.total_predictions ?? 0}</strong>
        </article>

        <article className="analytics-stat">
          <span>Outcome Categories</span>
          <strong>{Object.keys(data?.outcome_distribution || {}).length}</strong>
        </article>
      </div>

      <div className="analytics-grid">
        <BarChart
          title="Patient Outcome Distribution"
          data={data?.outcome_distribution}
          colorClass="bar-teal"
        />

        <BarChart
          title="Patients by Region"
          data={data?.region_distribution}
          colorClass="bar-blue"
        />

        <BarChart
          title="Patients by Department"
          data={data?.department_distribution}
          colorClass="bar-purple"
        />
      </div>

      <p className="analytics-note">
        Analytics reflects records currently stored in the application database.
        Prediction outcomes are model outputs, not clinical diagnoses.
      </p>
    </main>
  );
}
