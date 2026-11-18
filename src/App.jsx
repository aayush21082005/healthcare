import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import PatientData from "./pages/PatientData";
import UploadData from "./pages/UploadData";
import Prediction from "./pages/Prediction";
import Analytics from "./pages/Analytics";
import History from "./pages/History";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<Layout />}>

          <Route path="/" element={<Dashboard />} />

          <Route
            path="/patients"
            element={<PatientData />}
          />

          <Route
            path="/upload"
            element={<UploadData />}
          />

          <Route
            path="/prediction"
            element={<Prediction />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/history"
            element={<History />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;