const API_URL = "http://127.0.0.1:8000";

async function apiRequest(path, options = {}) {
let response;

try {
response = await fetch(`${API_URL}${path}`, options);
} catch {
throw new Error(
"Backend se connection nahi ho raha. Check karo ki FastAPI port 8000 par running hai."
);
}

const data = await response.json().catch(() => ({}));

if (!response.ok) {
const message =
typeof data.detail === "string"
? data.detail
: `Request failed (${response.status})`;

```
throw new Error(message);
```

}

return data;
}

export const getPatients = () =>
apiRequest("/patients");

export const addPatient = (patient) =>
apiRequest("/patients", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(patient),
});

export const deletePatient = (patientId) =>
apiRequest(`/patients/${encodeURIComponent(patientId)}`, {
method: "DELETE",
});

export const uploadCSV = (file) => {
const formData = new FormData();
formData.append("file", file);

return apiRequest("/upload", {
method: "POST",
body: formData,
});
};

export const predictOutcome = (patient) =>
apiRequest("/predict", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(patient),
});

export const getPredictionHistory = () =>
apiRequest("/predictions");

export const getAnalytics = async () => {
  const response = await fetch("http://127.0.0.1:8000/analytics");

  if (!response.ok) {
    throw new Error("Unable to fetch analytics");
  }

  return response.json();
};
