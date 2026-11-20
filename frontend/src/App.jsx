import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import PatientData from "./pages/PatientData";
import Prediction from "./pages/Prediction";
import UploadData from "./pages/UploadData";
import {
  clearAccessToken,
  getCurrentUser,
} from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          setAuthStatus(currentUser ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (active) {
          setAuthStatus("anonymous");
        }
      });

    const handleExpiredSession = () => {
      setUser(null);
      setAuthStatus("anonymous");
    };
    window.addEventListener("auth-expired", handleExpiredSession);

    return () => {
      active = false;
      window.removeEventListener("auth-expired", handleExpiredSession);
    };
  }, []);

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthStatus("authenticated");
  };

  const handleLogout = () => {
    clearAccessToken();
    setUser(null);
    setAuthStatus("anonymous");
  };

  return (
    <BrowserRouter>
      {authStatus === "checking" ? (
        <div className="auth-loading" role="status">
          Checking your session...
        </div>
      ) : authStatus === "authenticated" ? (
        <Routes>
          <Route
            element={<Layout user={user} onLogout={handleLogout} />}
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientData />} />
            <Route path="/upload" element={<UploadData />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </BrowserRouter>
  );
}

export default App;
