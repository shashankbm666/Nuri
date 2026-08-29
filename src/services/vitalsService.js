/**
 * Vitals Service - Telemetry and Stored Reading Data Service
 * 
 * Provides access to the patient's real stored telemetry reading.
 * Returns null if no reading has been recorded yet for the patient.
 */

// In-memory store of patient telemetry readings (populated strictly from real readings/captures)
const patientVitalsStore = {};

/**
 * Retrieves the latest stored vitals reading for a given patient.
 * Returns null if no telemetry has been recorded yet for this patient.
 */
export function getLatestVitalsForPatient(patientId) {
  if (!patientId) return null;

  if (patientVitalsStore[patientId]) {
    return patientVitalsStore[patientId];
  }

  // Check local storage for any persisted real readings for this patient
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(`nuri_patient_vitals_${patientId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        patientVitalsStore[patientId] = parsed;
        return parsed;
      } catch (e) {
        console.error("Failed to parse patient vitals from local storage", e);
      }
    }
  }

  return null;
}

/**
 * Saves or updates a vitals reading record for a patient (e.g. from ESP32 ingestion).
 */
export function saveVitalsReadingForPatient(patientId, readingData) {
  const record = {
    ...readingData,
    patientId,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Today",
    syncedAgoText: "Recorded " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  patientVitalsStore[patientId] = record;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(`nuri_patient_vitals_${patientId}`, JSON.stringify(record));
  }
  return record;
}
