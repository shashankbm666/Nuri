/**
 * Vitals Service - Telemetry and Stored Reading Data Service
 * 
 * Provides read-only access to the patient's latest stored telemetry reading
 * and historical data. Structured for drop-in replacement with a backend API call:
 * e.g., fetch(`/api/patients/${patientId}/vitals/latest`)
 */

import { initialSparklines } from "../data/mockData";

// In-memory store of patient telemetry readings (structured for future DB / REST API)
const patientVitalsStore = {};

/**
 * Retrieves the latest stored vitals reading for a given patient.
 * Returns the patient's specific telemetry reading.
 */
export function getLatestVitalsForPatient(patientId) {
  if (!patientId) return null;

  if (patientVitalsStore[patientId]) {
    return patientVitalsStore[patientId];
  }

  // Check local storage for any persisted readings for this patient
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(`nuri_patient_vitals_${patientId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      patientVitalsStore[patientId] = parsed;
      return parsed;
    }
  }

  // Default baseline reading initialized for this patient
  const defaultReading = {
    patientId,
    timestamp: "10:45 AM, Today",
    syncedAgoText: "Recorded at check-in",
    heartRate: {
      value: 74,
      unit: "bpm",
      status: "Normal",
      level: "green",
      note: null,
      standardRange: "60 – 100 bpm",
      history: initialSparklines.heartRate
    },
    spO2: {
      value: 98,
      unit: "%",
      status: "Normal",
      level: "green",
      note: null,
      standardRange: "95% – 100%",
      history: initialSparklines.spO2
    },
    temperature: {
      value: 36.6,
      unit: "°C",
      status: "Normal",
      level: "green",
      note: null,
      standardRange: "36.1 – 37.2°C",
      history: initialSparklines.temperature
    }
  };

  patientVitalsStore[patientId] = defaultReading;
  return defaultReading;
}

/**
 * Saves or updates a vitals reading record for a patient (e.g. from ESP32 ingestion).
 */
export function saveVitalsReadingForPatient(patientId, readingData) {
  const record = {
    ...readingData,
    patientId,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Today"
  };
  patientVitalsStore[patientId] = record;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(`nuri_patient_vitals_${patientId}`, JSON.stringify(record));
  }
  return record;
}
