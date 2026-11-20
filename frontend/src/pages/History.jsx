import { useEffect, useState } from "react";

import {
  getPredictionHistory,
} from "../services/api";

const PAGE_SIZE = 100;

function History() {

  const [history, setHistory] =
    useState([]);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadHistory = async (targetOffset = offset) => {

    try {

      setLoading(true);

      const data =
        await getPredictionHistory(targetOffset, PAGE_SIZE);

      setHistory(data);
      setOffset(targetOffset);

      setError("");

    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadHistory();

  }, []);


  return (
    <div>

      <div className="page-heading">

        <div>

          <span className="eyebrow">
            RECORDS
          </span>

          <h1>
            Prediction History
          </h1>

          <p>
            Predictions stored by the backend.
          </p>

        </div>

      </div>


      {error && (

        <div className="error-message" role="alert">
          {error}
        </div>

      )}


      <section className="content-card">

        <div className="section-header">

          <div>

            <h2>
              Prediction Records
            </h2>

            <p>
              {history.length}
              {" "}
              prediction(s)
            </p>

          </div>


          <button
            className="secondary-button"
            onClick={() => loadHistory(offset)}
            type="button"
          >
            Refresh
          </button>

        </div>


        {loading ? (

          <div className="empty-table" role="status">
            Loading...
          </div>

        ) : history.length === 0 ? (

          <div className="empty-table">

            <div className="empty-table-icon">
              ◷
            </div>

            <h3>
              No prediction history
            </h3>

            <p>
              Generate a prediction first.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table>
              <caption className="sr-only">Prediction history</caption>

              <thead>

                <tr>

                  <th scope="col">
                    Patient ID
                  </th>

                  <th scope="col">
                    Outcome
                  </th>

                  <th scope="col">
                    Confidence
                  </th>

                  <th scope="col">
                    Date & Time
                  </th>

                </tr>

              </thead>


              <tbody>

                {history.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      <td>

                        <strong>
                          {
                            item.patient_id
                          }
                        </strong>

                      </td>


                      <td>

                        <span
                          className={`risk-badge ${(item.outcome || "unknown")
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {item.outcome || "Unknown"}
                        </span>

                      </td>


                      <td>
                        {
                          item.probability
                        }%
                      </td>


                      <td>
                        {
                          new Date(
                            item.created_at
                          ).toLocaleString()
                        }
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

        {!loading && (
          <nav className="pagination-controls" aria-label="Prediction history pagination">
            <button
              className="secondary-button"
              disabled={offset === 0}
              onClick={() => loadHistory(Math.max(0, offset - PAGE_SIZE))}
              type="button"
            >
              Previous
            </button>
            <span aria-live="polite">
              Records {history.length ? offset + 1 : 0} to {offset + history.length}
            </span>
            <button
              className="secondary-button"
              disabled={history.length < PAGE_SIZE}
              onClick={() => loadHistory(offset + PAGE_SIZE)}
              type="button"
            >
              Next
            </button>
          </nav>
        )}

      </section>

    </div>
  );
}


export default History;