import { useState } from "react";

import {
  uploadCSV,
} from "../services/api";


function UploadData() {

  const [file, setFile] =
    useState(null);

  const [preview, setPreview] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==========================================
  // READ CSV FOR PREVIEW
  // ==========================================

  const parseCSV = (text) => {

    const lines =
      text
        .trim()
        .split(/\r?\n/);


    if (lines.length < 2) {
      return [];
    }


    const headers =
      lines[0]
        .split(",")
        .map(
          (header) =>
            header.trim()
        );


    return lines
      .slice(1)
      .map((line) => {

        const values =
          line.split(",");

        const object = {};


        headers.forEach(
          (header, index) => {

            object[header] =
              values[index]
                ? values[index].trim()
                : "";

          }
        );


        return object;

      });

  };


  // ==========================================
  // SELECT FILE
  // ==========================================

  const handleFileChange = (
    event
  ) => {

    const selectedFile =
      event.target.files[0];


    if (!selectedFile) {
      return;
    }


    setFile(selectedFile);

    setMessage("");

    setError("");


    const reader =
      new FileReader();


    reader.onload = (e) => {

      const data =
        parseCSV(
          e.target.result
        );


      setPreview(
        data.slice(0, 10)
      );

    };


    reader.readAsText(
      selectedFile
    );

  };


  // ==========================================
  // UPLOAD TO BACKEND
  // ==========================================

  const handleUpload = async () => {

    if (!file) {

      setError(
        "Please select a CSV file first."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");

      setMessage("");


      const result =
        await uploadCSV(file);


      setMessage(
        `${result.records_added} records saved to database successfully.`
      );


      setFile(null);

      setPreview([]);


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <div>

      <div className="page-heading">

        <div>

          <span className="eyebrow">
            DATA IMPORT
          </span>

          <h1>
            Upload Patient Dataset
          </h1>

          <p>
            CSV data will be processed by
            the backend and stored in the
            database.
          </p>

        </div>

      </div>


      {error && (

        <div className="error-message" role="alert">
          {error}
        </div>

      )}


      {message && (

        <div className="success-message" role="status">
          {message}
        </div>

      )}


      <section className="content-card">

        <div className="upload-area">

          <div className="upload-icon">
            ↑
          </div>


          <h2>
            Upload CSV Dataset
          </h2>


          <p>
            Select your patient dataset.
          </p>


          <label className="file-button">

            Choose CSV File

            <input
              type="file"
              accept=".csv"
              onChange={
                handleFileChange
              }
              hidden
            />

          </label>


          {file && (

            <div className="selected-file">

              <strong>
                Selected:
              </strong>

              {" "}

              {file.name}

            </div>

          )}


          {file &&
            preview.length > 0 && (

            <button
              className="primary-button upload-submit"
              onClick={
                handleUpload
              }
              disabled={loading}
            >

              {loading
                ? "Uploading..."
                : "Upload & Save Data"}

            </button>

          )}

        </div>

      </section>


      {preview.length > 0 && (

        <section className="content-card">

          <div className="section-header">

            <div>

              <h2>
                Dataset Preview
              </h2>

              <p>
                First {preview.length}
                {" "}
                records
              </p>

            </div>

          </div>


          <div className="table-container">

            <table>

              <thead>

                <tr>

                  {Object.keys(
                    preview[0]
                  ).map(
                    (key) => (

                      <th key={key}>
                        {key}
                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {preview.map(
                  (row, index) => (

                    <tr key={index}>

                      {Object.values(
                        row
                      ).map(
                        (value, i) => (

                          <td key={i}>
                            {value}
                          </td>

                        )
                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

      )}

    </div>
  );
}


export default UploadData;