import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Summary-first, expand-on-demand Triage Survey Card for the Doctor Dashboard.
 * 
 * Default (collapsed): Single compact row scannable in <2 seconds.
 * Expanded (on click): Reveals the full 4-question screening, severity bar, and additional symptoms.
 */

const PRIORITY_CONFIGS = {
  red: {
    badgeText: "RED · Immediate",
    bg: "bg-rose-50/50 dark:bg-rose-950/25",
    border: "border-rose-200 dark:border-rose-800/80",
    text: "text-rose-700 dark:text-rose-400",
    badgeBg: "bg-rose-600 text-white",
    barActiveBg: "bg-rose-600"
  },
  orange: {
    badgeText: "ORANGE · Very Urgent",
    bg: "bg-amber-50/40 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/70",
    text: "text-amber-700 dark:text-amber-400",
    badgeBg: "bg-amber-500 text-white",
    barActiveBg: "bg-amber-500"
  },
  yellow: {
    badgeText: "YELLOW · Urgent",
    bg: "bg-yellow-50/30 dark:bg-yellow-950/15",
    border: "border-yellow-200 dark:border-yellow-800/50",
    text: "text-yellow-700 dark:text-yellow-400",
    badgeBg: "bg-yellow-500 text-white",
    barActiveBg: "bg-yellow-500"
  },
  green: {
    badgeText: "GREEN · Standard",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/15",
    border: "border-emerald-200 dark:border-emerald-800/40",
    text: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-600 text-white",
    barActiveBg: "bg-emerald-600"
  },
  blue: {
    badgeText: "BLUE · Non-urgent",
    bg: "bg-slate-50 dark:bg-zinc-900/40",
    border: "border-slate-200 dark:border-zinc-800",
    text: "text-slate-700 dark:text-zinc-300",
    badgeBg: "bg-slate-700 text-white",
    barActiveBg: "bg-slate-700"
  }
};

const RED_FLAG_SHORT_LABELS = {
  difficultyBreathing: "Severe difficulty breathing",
  severePain: "Severe pain (8-10)",
  suddenOnset: "Sudden onset in last hour",
  faintingOrSyncope: "Fainted / syncope"
};

const RED_FLAG_FULL_QUESTIONS = {
  difficultyBreathing: "Severe difficulty breathing right now",
  severePain: "Pain severe (8-10 out of 10)",
  suddenOnset: "Started suddenly in the last hour",
  faintingOrSyncope: "Fainted or syncope sensation"
};

export default function PatientTriageDetailCard({ surveyData, darkMode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!surveyData) {
    return (
      <div className="rounded-2xl p-4 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs text-slate-400">
        <span>No symptom survey recorded for this patient.</span>
        <span className="text-slate-500 font-mono">Unclassified</span>
      </div>
    );
  }

  const priorityKey = surveyData.computedPriority || "green";
  const priorityConfig = PRIORITY_CONFIGS[priorityKey] || PRIORITY_CONFIGS.green;

  const redFlags = surveyData.redFlags || {};
  
  // Extract only the red flags that actually fired (answered YES)
  const activeRedFlags = Object.entries(redFlags)
    .filter(([_, value]) => value === true)
    .map(([key]) => RED_FLAG_SHORT_LABELS[key] || key);

  // Compute concise "Reason" string
  const reasonText = activeRedFlags.length > 0
    ? activeRedFlags.join(", ")
    : `Severity rated ${surveyData.severityRating}/5`;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${priorityConfig.bg} ${priorityConfig.border} shadow-xs overflow-hidden`}>
      {/* ── 1. Default (Collapsed) State — Single Compact Summary Row ── */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
          {/* Single Urgency Badge */}
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${priorityConfig.badgeBg} shadow-xs shrink-0 self-start sm:self-auto`}>
            {priorityConfig.badgeText}
          </span>

          {/* Inline Chief Complaint & Trigger Reason */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Chief Complaint: <span className={priorityConfig.text}>{surveyData.chiefComplaint}</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">•</span>
              <span className="text-xs text-slate-600 dark:text-zinc-300 font-normal">
                Reason: <strong className={activeRedFlags.length > 0 ? priorityConfig.text : "font-medium text-slate-700 dark:text-zinc-200"}>{reasonText}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Corner: Secondary Timestamp & Expand Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
            {surveyData.submittedAt}
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-zinc-200 transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>{isExpanded ? "Hide Details" : "View Details"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* ── 2. Expanded State — Revealed below summary on click ── */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-black/5 dark:border-white/10 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Full 4-Question Red-Flag Screening List */}
            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                Safety Screening (4 Questions)
              </div>

              <div className="space-y-1.5 text-xs">
                {Object.entries(RED_FLAG_FULL_QUESTIONS).map(([key, questionText]) => {
                  const isFlagged = !!redFlags[key];
                  return (
                    <div key={key} className="flex items-center justify-between text-[11px] gap-2">
                      <span className={isFlagged ? "text-rose-700 dark:text-rose-300 font-semibold" : "text-slate-500 dark:text-slate-400"}>
                        {questionText}
                      </span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 ${
                        isFlagged 
                          ? "bg-rose-600 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {isFlagged ? "YES" : "No"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reported Severity Bar (Single color matching MTS Triage Level) */}
            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>Reported Severity</span>
                <span className={`text-xs font-extrabold font-mono ${priorityConfig.text}`}>
                  {surveyData.severityRating} / 5
                </span>
              </div>

              <div className="space-y-2 py-1">
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-2 rounded-full transition-all ${
                        lvl <= surveyData.severityRating
                          ? priorityConfig.barActiveBg
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Severity: {surveyData.severityRating}/5
                </p>
              </div>
            </div>

            {/* Additional Symptoms Tags */}
            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                Additional Symptoms
              </div>

              <div className="flex flex-wrap gap-1.5 py-1">
                {surveyData.additionalSymptoms && surveyData.additionalSymptoms.length > 0 ? (
                  surveyData.additionalSymptoms.map((symp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                    >
                      {symp}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No secondary symptoms reported</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">Informational reference</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
