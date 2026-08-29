import React, { useState } from "react";
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  HeartHandshake, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ClipboardList
} from "lucide-react";
import { savePatientTriageSurvey } from "../services/triageService";

/**
 * Symptom Survey Flow
 * 
 * Note: This triage classification is simplified and adapted for prototype use,
 * inspired by the Manchester Triage System (MTS) — not a clinical-grade implementation.
 */

const CHIEF_COMPLAINTS = [
  { id: "chest_pain", label: "Chest pain", description: "Pressure, tightness, or aching in chest" },
  { id: "trouble_breathing", label: "Trouble breathing", description: "Shortness of breath or rapid respiration" },
  { id: "fever", label: "Fever", description: "Elevated body temperature or severe chills" },
  { id: "headache", label: "Headache", description: "Throbbing, sharp, or persistent head pain" },
  { id: "stomach_pain", label: "Stomach pain / nausea", description: "Abdominal cramps, digestive distress, vomiting" },
  { id: "injury_wound", label: "Injury or wound", description: "Sprain, cut, burn, or physical trauma" },
  { id: "something_else", label: "Something else", description: "General malaise or other symptoms" }
];

const RED_FLAG_QUESTIONS = [
  { id: "difficultyBreathing", question: "Are you having severe difficulty breathing right now?" },
  { id: "severePain", question: "Is the pain severe (8-10 out of 10)?" },
  { id: "suddenOnset", question: "Did this start suddenly, in the last hour?" },
  { id: "faintingOrSyncope", question: "Have you fainted, or do you feel like you might?" }
];

const ADDITIONAL_SYMPTOMS = [
  "Fatigue",
  "Dizziness",
  "Cough",
  "Chills",
  "Body ache",
  "Nausea"
];

export default function SymptomSurvey({
  patientId = "MED-89421",
  onComplete,
  onCancel
}) {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [redFlags, setRedFlags] = useState({
    difficultyBreathing: null,
    severePain: null,
    suddenOnset: null,
    faintingOrSyncope: null
  });
  const [severityRating, setSeverityRating] = useState(3);
  const [additionalSymptoms, setAdditionalSymptoms] = useState([]);
  const [validationError, setValidationError] = useState(null);

  // Toggle Red-Flag answer
  const handleRedFlagChange = (questionId, value) => {
    setRedFlags(prev => ({
      ...prev,
      [questionId]: value
    }));
    setValidationError(null);
  };

  // Toggle Additional Symptom checkbox
  const handleToggleSymptom = (symptom) => {
    setAdditionalSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Step Validation & Navigation
  const handleNext = () => {
    setValidationError(null);

    if (step === 1) {
      if (!chiefComplaint) {
        setValidationError("Please select your primary symptom or reason for visit.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const unanswered = Object.entries(redFlags).some(([_, val]) => val === null);
      if (unanswered) {
        setValidationError("Please answer all 4 safety screening questions.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    // Prepare payload
    const surveyPayload = {
      patientId,
      chiefComplaint,
      redFlags: {
        difficultyBreathing: !!redFlags.difficultyBreathing,
        severePain: !!redFlags.severePain,
        suddenOnset: !!redFlags.suddenOnset,
        faintingOrSyncope: !!redFlags.faintingOrSyncope
      },
      severityRating: Number(severityRating),
      additionalSymptoms
    };

    // Save record with MTS-inspired priority calculation (handled internally by triageService)
    const savedRecord = savePatientTriageSurvey(surveyPayload);
    setIsSubmitted(true);

    if (onComplete) {
      onComplete(savedRecord);
    }
  };

  // ── Confirmation Screen (Generic, Calming — No Raw Priority Color Shown) ──
  if (isSubmitted) {
    return (
      <div className="rounded-2xl p-6 sm:p-10 border bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center space-y-6 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/40">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Information Recorded
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
            Thanks, your symptom information has been recorded and securely shared with the attending OPD physician for clinical review.
          </p>
        </div>

        {/* Quiet Summary Pill */}
        <div className="max-w-xs mx-auto p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 text-xs text-slate-600 dark:text-zinc-300 text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400 dark:text-zinc-500 font-normal">Primary Concern:</span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">{chiefComplaint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 dark:text-zinc-500 font-normal">Severity Score:</span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">{severityRating} / 5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 dark:text-zinc-500 font-normal">Status:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Ready for Consultation</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onCancel ? onCancel() : null}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer shadow-sm"
          >
            Proceed to Vitals Check
          </button>
        </div>
      </div>
    );
  }

  // ── Step-by-Step Survey UI ──
  return (
    <div className="rounded-2xl p-6 sm:p-8 border bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
      {/* Top Header & Step Progress */}
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Pre-Consultation Symptom Survey
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
            Step {step} of 4
          </span>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step
                  ? "bg-slate-900 dark:bg-zinc-100"
                  : "bg-slate-100 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── STEP 1: Chief Complaint (Single Select) ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              What is your primary symptom or reason for today's visit?
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Select the main health concern you want to discuss with the doctor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CHIEF_COMPLAINTS.map((item) => {
              const isSelected = chiefComplaint === item.label;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setChiefComplaint(item.label);
                    setValidationError(null);
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100 shadow-sm"
                      : "bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm">
                    {item.label}
                  </div>
                  <p className={`text-[11px] font-normal mt-0.5 leading-snug ${
                    isSelected ? "text-slate-200 dark:text-zinc-600" : "text-slate-400 dark:text-zinc-500"
                  }`}>
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: Red-Flag Safety Screening (Yes / No) ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              Safety & Urgent Symptoms Screening
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Please answer all 4 quick safety questions regarding your current state.
            </p>
          </div>

          <div className="space-y-3">
            {RED_FLAG_QUESTIONS.map((q) => {
              const currentVal = redFlags[q.id];
              return (
                <div
                  key={q.id}
                  className="p-3.5 sm:p-4 rounded-xl border bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <span className="text-xs sm:text-sm font-normal text-slate-800 dark:text-zinc-200">
                    {q.question}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRedFlagChange(q.id, true)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        currentVal === true
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRedFlagChange(q.id, false)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        currentVal === false
                          ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100 shadow-xs"
                          : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: Overall Severity (1 - 5 Scale) ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              How severe would you say this feels overall?
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Rate your discomfort from 1 (Mild) to 5 (Worst ever felt).
            </p>
          </div>

          {/* 5-Button Select */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { val: 1, label: "Mild", sub: "Barely noticeable" },
              { val: 2, label: "Moderate", sub: "Noticeable, manageable" },
              { val: 3, label: "Significant", sub: "Affecting routine" },
              { val: 4, label: "Severe", sub: "Very uncomfortable" },
              { val: 5, label: "Extreme", sub: "Worst ever felt" }
            ].map((item) => {
              const isSelected = severityRating === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setSeverityRating(item.val)}
                  className={`p-3 sm:p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[90px] ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100 shadow-xs scale-[1.02]"
                      : "bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <span className="text-lg sm:text-2xl font-bold font-mono">
                    {item.val}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-semibold ${
                    isSelected ? "text-slate-200 dark:text-zinc-700" : "text-slate-600 dark:text-zinc-400"
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-400">
            Selected: <strong className="text-slate-900 dark:text-white">Level {severityRating}</strong> — {
              severityRating === 1 ? "Mild discomfort" :
              severityRating === 2 ? "Moderate discomfort" :
              severityRating === 3 ? "Significant symptom intensity" :
              severityRating === 4 ? "Severe discomfort" : "Extreme intensity"
            }
          </div>
        </div>
      )}

      {/* ── STEP 4: Additional Symptoms (Multi-Select Checkboxes) ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              Additional Symptoms (Optional)
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Select any other accompanying sensations. (Informational for the doctor).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ADDITIONAL_SYMPTOMS.map((symptom) => {
              const isSelected = additionalSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleToggleSymptom(symptom)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-medium ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100"
                      : "bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
                  }`}
                >
                  <span>{symptom}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected
                      ? "bg-white text-slate-900 dark:bg-zinc-900 dark:text-white border-transparent"
                      : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                  }`}>
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {additionalSymptoms.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-zinc-500 italic text-center pt-1">
              No additional symptoms selected (optional)
            </p>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-zinc-500 hover:text-slate-600 transition"
              >
                Skip for now
              </button>
            )
          )}
        </div>

        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Submit Information</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
