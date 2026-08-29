import React, { useState } from "react";
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  ClipboardList,
  Check
} from "lucide-react";
import { savePatientTriageSurvey } from "../services/triageService";

/**
 * Symptom Survey Flow
 * 
 * Auto-advancing single-select flow with ~250ms visual confirmation:
 * - Step 1: Chief Complaint (auto-advances on tap)
 * - Step 2: Red-Flag Safety Questions (auto-advances per Yes/No tap)
 * - Step 3: Severity Slider/Scale (manual Continue)
 * - Step 4: Additional Symptoms Multi-select (manual Submit)
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
  patientId,
  onComplete,
  onCancel
}) {
  const [step, setStep] = useState(1);
  const [activeRedFlagIdx, setActiveRedFlagIdx] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto-advance visual confirmation feedback state
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
  const [redFlagFeedback, setRedFlagFeedback] = useState(null); // { questionId, value: true/false }

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

  // ── Step 1: Chief Complaint Selection with Auto-Advance ──
  const handleSelectChiefComplaint = (item) => {
    setChiefComplaint(item.label);
    setSelectedFeedbackId(item.id);
    setValidationError(null);

    // Brief visual confirmation (~250ms) before advancing
    setTimeout(() => {
      setSelectedFeedbackId(null);
      setActiveRedFlagIdx(0);
      setStep(2);
    }, 250);
  };

  // ── Step 2: Red-Flag Yes/No Tap with Auto-Advance ──
  const handleRedFlagAnswer = (questionId, value) => {
    setRedFlags((prev) => ({
      ...prev,
      [questionId]: value
    }));
    setRedFlagFeedback({ questionId, value });
    setValidationError(null);

    // Brief visual confirmation (~250ms) before moving to next question / Step 3
    setTimeout(() => {
      setRedFlagFeedback(null);
      if (activeRedFlagIdx < RED_FLAG_QUESTIONS.length - 1) {
        setActiveRedFlagIdx((prev) => prev + 1);
      } else {
        // After last red-flag question, auto-advance to Step 3
        setStep(3);
      }
    }, 250);
  };

  // ── Step 4: Toggle Additional Symptom checkbox (Multi-select) ──
  const handleToggleSymptom = (symptom) => {
    setAdditionalSymptoms((prev) => 
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Navigation handlers
  const handleBack = () => {
    setValidationError(null);
    if (step === 2) {
      if (activeRedFlagIdx > 0) {
        setActiveRedFlagIdx((prev) => prev - 1);
      } else {
        setStep(1);
      }
    } else if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleNextFromSeverity = () => {
    setStep(4);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

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

    const savedRecord = savePatientTriageSurvey(surveyPayload);
    setIsSubmitted(true);

    if (onComplete) {
      onComplete(savedRecord);
    }
  };

  // ── Confirmation Screen ──
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
            Your symptom survey has been recorded and securely synchronized with the attending OPD physician station.
          </p>
        </div>

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
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main Step-by-Step Survey UI ──
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

      {/* ── STEP 1: Chief Complaint (Single Select with Auto-Advance) ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              What is your primary symptom or reason for today's visit?
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Tap an option to select and continue automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CHIEF_COMPLAINTS.map((item) => {
              const isSelected = chiefComplaint === item.label;
              const isFeedbackActive = selectedFeedbackId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectChiefComplaint(item)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                    isFeedbackActive || isSelected
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100 shadow-sm scale-[0.99]"
                      : "bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                      <span>{item.label}</span>
                    </div>
                    <p className={`text-[11px] font-normal mt-0.5 leading-snug ${
                      isFeedbackActive || isSelected ? "text-slate-200 dark:text-zinc-600" : "text-slate-400 dark:text-zinc-500"
                    }`}>
                      {item.description}
                    </p>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-transform ${
                    isFeedbackActive || isSelected
                      ? "bg-white text-slate-900 dark:bg-zinc-900 dark:text-white border-transparent scale-110"
                      : "border-slate-300 dark:border-zinc-600 bg-white/60 dark:bg-zinc-800"
                  }`}>
                    {(isFeedbackActive || isSelected) && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: Red-Flag Safety Questions (Auto-Advance on Yes/No tap) ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                Safety & Urgent Symptoms Screening
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
                Question {activeRedFlagIdx + 1} of {RED_FLAG_QUESTIONS.length} • Tap Yes or No to advance.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
              {activeRedFlagIdx + 1}/{RED_FLAG_QUESTIONS.length}
            </span>
          </div>

          {/* Current Active Question Card */}
          {(() => {
            const currentQ = RED_FLAG_QUESTIONS[activeRedFlagIdx];
            const currentAnswer = redFlags[currentQ.id];
            const isYesFeedback = redFlagFeedback?.questionId === currentQ.id && redFlagFeedback?.value === true;
            const isNoFeedback = redFlagFeedback?.questionId === currentQ.id && redFlagFeedback?.value === false;

            return (
              <div className="p-5 sm:p-6 rounded-2xl border bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200/90 dark:border-zinc-700/70 space-y-5 animate-fade-in">
                <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Yes Option */}
                  <button
                    type="button"
                    onClick={() => handleRedFlagAnswer(currentQ.id, true)}
                    className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      isYesFeedback || currentAnswer === true
                        ? "bg-rose-600 text-white border-rose-600 shadow-md scale-[0.98]"
                        : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300"
                    }`}
                  >
                    <span>Yes</span>
                    {(isYesFeedback || currentAnswer === true) && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  {/* No Option */}
                  <button
                    type="button"
                    onClick={() => handleRedFlagAnswer(currentQ.id, false)}
                    className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      isNoFeedback || currentAnswer === false
                        ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100 shadow-md scale-[0.98]"
                        : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>No</span>
                    {(isNoFeedback || currentAnswer === false) && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Mini Stepper Dots for Red Flag Questions */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {RED_FLAG_QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeRedFlagIdx
                    ? "w-6 bg-slate-900 dark:bg-zinc-100"
                    : redFlags[q.id] !== null
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Overall Severity (1 - 5 Slider / Scale - Manual Continue) ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              How severe would you say this feels overall?
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Select or slide to your symptom intensity (1 to 5), then tap Continue.
            </p>
          </div>

          {/* 5-Level Scale Selector */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { val: 1, label: "Mild", sub: "Barely noticeable" },
              { val: 2, label: "Moderate", sub: "Manageable" },
              { val: 3, label: "Significant", sub: "Affecting routine" },
              { val: 4, label: "Severe", sub: "Very uncomfortable" },
              { val: 5, label: "Extreme", sub: "Worst ever" }
            ].map((item) => {
              const isSelected = severityRating === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setSeverityRating(item.val)}
                  className={`p-3 sm:p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[85px] ${
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
            Selected: <strong className="text-slate-900 dark:text-white">Level {severityRating} / 5</strong> — {
              severityRating === 1 ? "Mild discomfort" :
              severityRating === 2 ? "Moderate discomfort" :
              severityRating === 3 ? "Significant symptom intensity" :
              severityRating === 4 ? "Severe discomfort" : "Extreme intensity"
            }
          </div>
        </div>
      )}

      {/* ── STEP 4: Additional Symptoms (Multi-Select Checkboxes - Manual Submit) ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              Additional Symptoms (Optional)
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              Select any other accompanying symptoms, then submit your survey.
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

      {/* Navigation Footer */}
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
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-zinc-500 hover:text-slate-600 transition cursor-pointer"
              >
                Skip for now
              </button>
            )
          )}
        </div>

        {/* Action Button: Only shown for Step 3 (Continue) and Step 4 (Submit) */}
        <div>
          {step === 3 && (
            <button
              type="button"
              onClick={handleNextFromSeverity}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
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
