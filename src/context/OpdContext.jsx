import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { generatePatientId } from "../components/PatientOnboardingModal";
import { getPatientTriageSurvey } from "../services/triageService";
import { fetchWithRetry } from "../utils/fetchWithRetry";

/**
 * ============================================================================
 * OPD DATA CONTEXT — Real PostgreSQL Backend Bridge
 * ============================================================================
 *
 * Data source of truth: the Nuri backend (PostgreSQL via Render).
 * On mount the OpdProvider fetches ALL registered patients from GET /api/patients
 * and seeds the queue — so the Doctor Dashboard survives page refreshes.
 *
 * - registerOrUpdatePatientInQueue() deduplicates by auth0Sub.
 * - Triage is restored from localStorage (keyed by deterministic MED-XXXXX id).
 * - localStorage is NOT used for patient identity — only triage survey records.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const OpdContext = createContext(null);

export function OpdProvider({ children }) {
  const [patients, setPatients] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);

  // ── Seed queue from backend on mount ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithRetry(
          `${BACKEND_URL}/api/patients`,
          {},
          { onSlow: () => setServerWaking(true) }
        );
        setServerWaking(false);
        if (!res.ok) return;
        const { data } = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        const seeded = data.map((row) => {
          const patientId = generatePatientId(row.auth0_sub);
          const triage = getPatientTriageSurvey(patientId);

          return {
            id: patientId,
            auth0Sub: row.auth0_sub,
            name: row.full_name,
            age: row.age || "—",
            gender: row.gender || "Unknown",
            weight: row.weight_kg ? `${row.weight_kg} kg` : null,
            height: row.height_cm ? `${row.height_cm} cm` : null,
            timeWaiting: "—",
            timeWaitingMinutes: 0,
            inQueue: true,
            status: "Ready for Consult",
            triage: triage
              ? {
                  patientId,
                  chiefComplaint: triage.chiefComplaint,
                  redFlags: triage.redFlags || {},
                  severityRating: triage.severityRating || 1,
                  additionalSymptoms: triage.additionalSymptoms || [],
                  computedPriority: triage.computedPriority || "green",
                  submittedAt: triage.submittedAt || new Date().toISOString(),
                }
              : null,
            vitals: null,
            history: [],
          };
        });

        setPatients(seeded);
      } catch (err) {
        console.error("[OpdContext] Failed to seed queue from backend:", err.message);
        setServerWaking(false);
      } finally {
        setQueueLoading(false);
      }
    })();
  }, []); // run once on mount

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
        queueLoading,
        serverWaking,
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
