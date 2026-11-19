import { useEffect, useState } from "react";

import {
  getPredictionHistory,
} from "../services/api";


function History() {

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadHistory = async () => {

    try {

      setLoading(true);

      const data =
        await getPredictionHistory();

      setHistory(data);

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

        <div className="error-message">
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
            onClick={
              loadHistory
            }
          >
            Refresh
          </button>

        </div>


        {loading ? (

          <div className="empty-table">
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

              <thead>

                <tr>

                  <th>
                    Patient ID
                  </th>

                  <th>
                    Outcome
                  </th>

                  <th>
                    Confidence
                  </th>

                  <th>
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
                          className={
                            `risk-badge ${
                              item.outcome
                                .toLowerCase()
                                .replace(
                                  " ",
                                  "-"
                                )
                            }`
                          }
                        >
                          {item.outcome}
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

      </section>

    </div>
  );
}


export default History;