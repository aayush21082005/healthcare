
import { useEffect, useState } from "react";
import { getPatients, getAnalytics } from "../services/api";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="dash-stat-card">
      <span>{title}</span>
      <strong>{value ?? 0}</strong>
      <small>{subtitle}</small>
    </div>
  );
}

function DashboardChart({ title, data, color }) {
  const entries = Object.entries(data || {});
  const max = Math.max(
    ...entries.map(([, value]) => Number(value) || 0),
    1
  );

  return (
    <section className="dash-chart-card">
      <h2>{title}</h2>

      {entries.length === 0 ? (
        <p className="dash-empty">
          No data available yet. Add records to view this graph.
        </p>
      ) : (
        <div className="dash-chart-list">
          {entries.map(([label, value]) => {
            const count = Number(value) || 0;
            const percentage = (count / max) * 100;

            return (
              <div className="dash-chart-row" key={label}>
                <div className="dash-chart-label">
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>

                <div className="dash-chart-track">
                  <div
                    className={`dash-chart-fill ${color}`}
                    style={{ width: `${percentage}%` }}
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

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [patientData, analyticsData] = await Promise.all([
        getPatients(),
        getAnalytics(),
      ]);

      setPatients(patientData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <h1>Healthcare Dashboard</h1>
        <p>Loading dashboard data...</p>
      </main>
    );
  }

  const recentPatients = patients.slice(0, 5);

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            HEALTHCARE ANALYTICS SYSTEM
          </span>
          <h1>Healthcare Dashboard</h1>
          <p>
            Patient data, machine learning predictions and
            healthcare analytics overview.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={loadDashboard}
        >
          Refresh Dashboard
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="dashboard-stats">
        <StatCard
          title="Total Patients"
          value={analytics?.total_patients ?? patients.length}
          subtitle="Stored patient records"
        />

        <StatCard
          title="Total Predictions"
          value={analytics?.total_predictions ?? 0}
          subtitle="Generated predictions"
        />

        <StatCard
          title="Outcome Categories"
          value={Object.keys(
            analytics?.outcome_distribution || {}
          ).length}
          subtitle="Recorded outcome types"
        />
      </div>

      {/* GRAPHS */}
      <div className="dashboard-graphs">
        <DashboardChart
          title="Patient Outcome Distribution"
          data={analytics?.outcome_distribution}
          color="dash-teal"
        />

        <DashboardChart
          title="Patients by Region"
          data={analytics?.region_distribution}
          color="dash-blue"
        />

        <DashboardChart
          title="Patients by Department"
          data={analytics?.department_distribution}
          color="dash-purple"
        />
      </div>

      {/* RECENT PATIENTS */}
      <section className="dash-recent-card">
        <div className="dash-recent-heading">
          <div>
            <h2>Recent Patient Records</h2>
            <p>Latest records saved in the database</p>
          </div>
        </div>

        {recentPatients.length === 0 ? (
          <p className="dash-empty">
            No patient records available.
          </p>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Region / Department</th>
                </tr>
              </thead>

              <tbody>
                {recentPatients.map((patient, index) => (
                  <tr
                    key={patient.id ?? patient.patient_id ?? index}
                  >
                    <td>{patient.patient_id ?? "N/A"}</td>
                    <td>{patient.age ?? "N/A"}</td>
                    <td>{patient.gender ?? "N/A"}</td>
                    <td>
                      {patient.demographics_region ||
                        patient.department ||
                        "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="dashboard-footer">
        Dashboard analytics are generated from records currently
        stored in the application database.
      </p>
    </main>
  );
}
