/**
 * Triage & Symptom Survey Service (MTS-Inspired)
 * 
 * Note: This triage classification is simplified and adapted for prototype use,
 * inspired by the Manchester Triage System (MTS) — not a clinical-grade implementation.
 */

// In-memory triage survey records stored dynamically by patientId
const triageSurveyDatabase = {};

/**
 * Calculates priority based on MTS-inspired triage rules:
 * - If any red flag is true -> 'red' (Immediate)
 * - Else if severity === 5 -> 'orange' (Very Urgent)
 * - Else if severity in [3, 4] -> 'yellow' (Urgent)
 * - Else if severity === 2 -> 'green' (Standard)
 * - Else -> 'blue' (Non-urgent)
 */
export function computeTriagePriority({ redFlags = {}, severityRating = 1 }) {
  const hasRedFlag = Object.values(redFlags).some((val) => val === true);

  if (hasRedFlag) {
    return "red";
  }
  if (severityRating === 5) {
    return "orange";
  }
  if (severityRating === 3 || severityRating === 4) {
    return "yellow";
  }
  if (severityRating === 2) {
    return "green";
  }
  return "blue";
}

/**
 * Saves a completed symptom survey for a patient
 */
export function savePatientTriageSurvey(surveyPayload) {
  const computedPriority = computeTriagePriority({
    redFlags: surveyPayload.redFlags,
    severityRating: surveyPayload.severityRating
  });

  const record = {
    ...surveyPayload,
    computedPriority,
    submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Today"
  };

  triageSurveyDatabase[surveyPayload.patientId] = record;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(`nuri_patient_triage_${surveyPayload.patientId}`, JSON.stringify(record));
  }
  return record;
}

/**
 * Retrieves the triage record for a given patient
 */
export function getPatientTriageSurvey(patientId) {
  if (!patientId) return null;

  if (triageSurveyDatabase[patientId]) {
    return triageSurveyDatabase[patientId];
  }
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(`nuri_patient_triage_${patientId}`);
    if (saved) return JSON.parse(saved);
  }
  return null;
}

export function getAllTriageSurveys() {
  return triageSurveyDatabase;
}
