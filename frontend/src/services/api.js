const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const TOKEN_KEY = "healthcare_access_token";

export function getAccessToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}

async function apiRequest(path, options = {}, skipAuth = false) {
  const headers = new Headers(options.headers || {});
  const token = skipAuth ? null : getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Backend se connection nahi ho raha. Please try again in a moment."
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      clearAccessToken();
      window.dispatchEvent(new Event("auth-expired"));
    }

    const message =
      typeof data.detail === "string"
        ? data.detail
        : `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function login(username, password) {
  const data = await apiRequest(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    true
  );
  window.sessionStorage.setItem(TOKEN_KEY, data.access_token);
  return { username: data.username };
}

export async function getCurrentUser() {
  if (!getAccessToken()) {
    return null;
  }
  return apiRequest("/auth/me");
}

export const getPatients = (offset = 0, limit = 100) =>
  apiRequest(`/patients?offset=${offset}&limit=${limit}`);

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

export const getPredictionHistory = (offset = 0, limit = 100) =>
  apiRequest(`/predictions?offset=${offset}&limit=${limit}`);

export const getAnalytics = () => apiRequest("/analytics");
