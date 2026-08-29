import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Esp32Simulator from "./pages/Esp32Simulator";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./auth/AuthProvider";
import { DoctorAuthProvider, useDoctorAuth } from "./auth/DoctorAuthContext";
import { OpdProvider } from "./context/OpdContext";


/** Redirects to landing page if doctor session is not active */
function DoctorProtectedRoute({ children }) {
  const { isAuthorized } = useDoctorAuth();
  if (!isAuthorized) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <DoctorAuthProvider>
        <OpdProvider>
          <HashRouter>
            <Routes>
              <Route
                path="/"
                element={<LandingPage darkMode={darkMode} setDarkMode={setDarkMode} />}
              />
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute>
                    <PatientDashboard darkMode={darkMode} setDarkMode={setDarkMode} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/dashboard"
                element={
                  <DoctorProtectedRoute>
                    <DoctorDashboard darkMode={darkMode} setDarkMode={setDarkMode} />
                  </DoctorProtectedRoute>
                }
              />
              {/* ⚠️ ESP32 Simulator — temporary dev tool, remove when real hardware exists */}
              <Route path="/esp32-simulator" element={<Esp32Simulator />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </OpdProvider>
      </DoctorAuthProvider>
    </AuthProvider>
  );
}
