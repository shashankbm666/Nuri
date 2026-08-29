import React, { createContext, useContext, useState, useEffect } from "react";
import { doctorPatientDatabase } from "../data/mockData";

/**
 * ============================================================================
 * OPD DATA CONTEXT (Temporary Client-Side In-Memory & LocalStorage Bridge)
 * ============================================================================
 * 
 * Note: This context acts as a temporary simulation bridge between the Patient 
 * portal and the Doctor OPD workstation in the absence of a real-time backend 
 * (e.g. PostgreSQL + WebSockets/SSE / REST API).
 * 
 * When a patient completes onboarding and their MTS Symptom Survey on the Patient 
 * portal, this store automatically inserts or updates their real Auth0 profile 
 * and survey-computed priority into the Doctor's live OPD queue array.
 */

const STORAGE_KEY = "nuri_opd_patient_database";

const OpdContext = createContext(null);

export function OpdProvider({ children }) {
  const [patients, setPatients] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved OPD database", e);
        }
      }
    }
    return doctorPatientDatabase;
  });

  // Sync to local storage on changes
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    }
  }, [patients]);

  /**
   * Adds or updates a patient in the OPD Triage Queue
   */
  const registerOrUpdatePatientInQueue = ({ profile, triageRecord, vitals }) => {
    if (!profile || !profile.patientId) return;

    setPatients((prevPatients) => {
      const existingIndex = prevPatients.findIndex(
        (p) => p.id === profile.patientId || (profile.auth0Sub && p.auth0Sub === profile.auth0Sub)
      );

      const patientEntry = {
        id: profile.patientId,
        auth0Sub: profile.auth0Sub || null,
        name: profile.name,
        age: typeof profile.age === "number" ? profile.age : parseInt(profile.age) || 30,
        gender: profile.gender || "Female",
        weight: profile.weight || "65 kg",
        height: profile.height || "170 cm",
        timeWaiting: "Just now",
        timeWaitingMinutes: 0,
        inQueue: true,
        status: "Ready for Consult",
        triage: triageRecord ? {
          patientId: profile.patientId,
          chiefComplaint: triageRecord.chiefComplaint,
          redFlags: triageRecord.redFlags || {},
          severityRating: triageRecord.severityRating || 1,
          additionalSymptoms: triageRecord.additionalSymptoms || [],
          computedPriority: triageRecord.computedPriority || "green",
          submittedAt: triageRecord.submittedAt || "Just now"
        } : null,
        vitals: vitals ? {
          heartRate: vitals.heartRate?.value || 74,
          spO2: vitals.spO2?.value || 98,
          temperature: vitals.temperature?.value || 36.6,
          recordedAt: "Just now",
          healthStatus: "Normal"
        } : {
          heartRate: 74,
          spO2: 98,
          temperature: 36.6,
          recordedAt: "Just now",
          healthStatus: "Normal"
        },
        history: [
          {
            id: `READ-${Date.now()}`,
            timestamp: "Today, Just now",
            heartRate: vitals?.heartRate?.value || 74,
            spO2: vitals?.spO2?.value || 98,
            temperature: vitals?.temperature?.value || 36.6,
            status: "Normal"
          }
        ]
      };

      if (existingIndex >= 0) {
        // Update existing record
        const updated = [...prevPatients];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...patientEntry,
          history: [
            ...(patientEntry.history || []),
            ...(updated[existingIndex].history || []).filter(h => !h.id.startsWith("READ-"))
          ]
        };
        return updated;
      } else {
        // Prepend new patient to the database
        return [patientEntry, ...prevPatients];
      }
    });
  };

  return (
    <OpdContext.Provider value={{
      patients,
      setPatients,
      registerOrUpdatePatientInQueue
    }}>
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
