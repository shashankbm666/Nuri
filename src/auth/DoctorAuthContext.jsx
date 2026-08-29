import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * ============================================================================
 * Doctor Auth Context — Shared Admin Password Gate
 * ============================================================================
 *
 * This is a simple shared-password session gate, NOT tied to individual doctor
 * identities. Designed for a shared-device OPD workstation.
 *
 * ⚠️  TEMPORARY: The password below ("admin123") is a plain-text placeholder.
 * Replace with a backend-verified hashed password before any real deployment.
 * See: POST /api/doctor/auth with bcrypt-hashed check on the Express server.
 */

// TODO: Replace with a backend POST /api/doctor/auth call that verifies a
// bcrypt-hashed password stored in the database. Never hardcode real passwords.
const DOCTOR_PASSWORD = "admin123"; // ← TEMPORARY PLACEHOLDER — NOT FOR PRODUCTION

const SESSION_KEY = "nuri_doctor_session";

const DoctorAuthContext = createContext(null);

export function DoctorAuthProvider({ children }) {
  // Persist within the tab session only (sessionStorage clears on tab close)
  const [isAuthorized, setIsAuthorized] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );

  /**
   * Attempt to authenticate with the given password.
   * Returns true on success, false on failure.
   */
  const attemptLogin = useCallback((password) => {
    if (password === DOCTOR_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthorized(true);
      return true;
    }
    return false;
  }, []);

  /**
   * Clear session — called when doctor clicks "Switch Role" or logs out.
   */
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthorized(false);
  }, []);

  return (
    <DoctorAuthContext.Provider value={{ isAuthorized, attemptLogin, logout }}>
      {children}
    </DoctorAuthContext.Provider>
  );
}

export function useDoctorAuth() {
  const ctx = useContext(DoctorAuthContext);
  if (!ctx) throw new Error("useDoctorAuth must be used within DoctorAuthProvider");
  return ctx;
}
