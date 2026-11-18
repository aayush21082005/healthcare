function DataTable({ patients = [] }) {
  if (patients.length === 0) {
    return (
      <div className="empty-table">
        <div className="empty-table-icon">
          +
        </div>

        <h3>No patient data available</h3>

        <p>
          Add patient information or upload a CSV
          dataset to see records here.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">

      <table>

        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Department</th>
            <th>BP</th>
            <th>Glucose</th>
            <th>Outcome</th>
          </tr>
        </thead>

        <tbody>

          {patients.map((patient, index) => (

            <tr key={patient.id || index}>

              <td>
                <strong>
                  {patient.id || `P-${index + 1}`}
                </strong>
              </td>

              <td>
                {patient.age || "-"}
              </td>

              <td>
                {patient.gender || "-"}
              </td>

              <td>
                {patient.department || "-"}
              </td>

              <td>
                {patient.bloodPressure || "-"}
              </td>

              <td>
                {patient.glucose || "-"}
              </td>

              <td>

                {patient.outcome ? (
                  <span
                    className={`risk-badge ${patient.outcome
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {patient.outcome}
                  </span>
                ) : (
                  <span className="pending-badge">
                    Pending
                  </span>
                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default DataTable;