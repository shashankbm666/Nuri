import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./auth/AuthProvider";
import { OpdProvider } from "./context/OpdContext";

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
              element={<DoctorDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </OpdProvider>
    </AuthProvider>
  );
}
