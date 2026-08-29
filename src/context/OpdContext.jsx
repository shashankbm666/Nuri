import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * ============================================================================
 * OPD DATA CONTEXT — Real PostgreSQL Backend Bridge
 * ============================================================================
 *
 * Data source of truth: the Nuri backend (PostgreSQL via Render).
 * This context NO LONGER uses localStorage as primary storage or falls back
 * to any mock/hardcoded patient arrays.
 *
 * - The OPD queue is populated ONLY by real patients who have completed
 *   onboarding (POST /api/patients) and submitted their triage survey.
 * - registerOrUpdatePatientInQueue() deduplicates by auth0Sub so a returning
 *   user never creates a second entry.
 * - localStorage is NOT used for patient data (only transient UI state if needed).
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const OpdContext = createContext(null);

export function OpdProvider({ children }) {
  // In-memory queue: populated only by real registrations this session.
  // On refresh the doctor re-fetches from the backend (future step).
  const [patients, setPatients] = useState([]);

  /**
   * Adds or updates a patient in the OPD Triage Queue.
   * Deduplication: if a patient with the same auth0Sub or patientId already
   * exists in the queue, their record is updated rather than duplicated.
   */
  const registerOrUpdatePatientInQueue = useCallback(({ profile, triageRecord, vitals }) => {
    if (!profile || !profile.patientId) return;

    setPatients((prev) => {
      const existingIndex = prev.findIndex(
        (p) =>
          p.id === profile.patientId ||
          (profile.auth0Sub && p.auth0Sub === profile.auth0Sub)
      );

      const patientEntry = {
        id: profile.patientId,
        auth0Sub: profile.auth0Sub || null,
        name: profile.name,
        age: typeof profile.age === "number" ? profile.age : parseInt(profile.age) || 30,
        gender: profile.gender || "Unknown",
        weight: profile.weight || null,
        height: profile.height || null,
        timeWaiting: "Just now",
        timeWaitingMinutes: 0,
        inQueue: true,
        status: "Ready for Consult",
        triage: triageRecord
          ? {
              patientId: profile.patientId,
              chiefComplaint: triageRecord.chiefComplaint,
              redFlags: triageRecord.redFlags || {},
              severityRating: triageRecord.severityRating || 1,
              additionalSymptoms: triageRecord.additionalSymptoms || [],
              computedPriority: triageRecord.computedPriority || "green",
              submittedAt: triageRecord.submittedAt || new Date().toISOString(),
            }
          : null,
        vitals: vitals
          ? {
              heartRate: vitals.heartRate?.value ?? null,
              spO2: vitals.spO2?.value ?? null,
              temperature: vitals.temperature?.value ?? null,
              recordedAt: "Just now",
              healthStatus: "Normal",
            }
          : null,   // No vitals yet — Doctor panel shows empty state, not fake numbers
        history: vitals
          ? [
              {
                id: `READ-${Date.now()}`,
                timestamp: "Today, Just now",
                heartRate: vitals?.heartRate?.value ?? null,
                spO2: vitals?.spO2?.value ?? null,
                temperature: vitals?.temperature?.value ?? null,
                status: "Normal",
              },
            ]
          : [],
      };

      if (existingIndex >= 0) {
        // Update existing — never duplicate a returning user
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...patientEntry,
          history: [
            ...(patientEntry.history || []),
            ...(updated[existingIndex].history || []),
          ],
        };
        return updated;
      }

      // New patient — prepend to queue
      return [patientEntry, ...prev];
    });
  }, []);

  /**
   * Clears a patient from the queue after consultation is complete.
   */
  const dischargePatient = useCallback((patientId) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  }, []);

  return (
    <OpdContext.Provider
      value={{
        patients,
        setPatients,
        registerOrUpdatePatientInQueue,
        dischargePatient,
        backendUrl: BACKEND_URL,
      }}
    >
      {children}
    </OpdContext.Provider>
  );
}

export function useOpd() {
  const context = useContext(OpdContext);
  if (!context) {
    throw new Error("useOpd must be used within an OpdProvider");
  }
  return context;
}
