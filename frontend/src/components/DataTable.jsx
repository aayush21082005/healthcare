function DataTable({ columns = [], data = [] }) {
  if (data.length === 0) {
    return (
      <div className="empty-table">
        <div className="empty-table-icon" aria-hidden="true">+</div>
        <h3>No patient data available</h3>
        <p>
          Add patient information or upload a CSV dataset to see records here.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <caption className="sr-only">Patient records</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.id ?? record.patient_id}>
              {columns.map((column) => (
                <td key={column.key}>
                  {record[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
