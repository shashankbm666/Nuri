import React from "react";

export default function PatientProfile({ patient }) {
  if (!patient) return null;

  const initials = patient.name
    ? patient.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "EV";

  const metrics = [
    { label: "Gender", value: patient.gender || "Female" },
    { label: "Age", value: typeof patient.age === "number" ? `${patient.age} yrs` : patient.age },
    { label: "Weight", value: patient.weight || "63 kg" },
    { label: "Height", value: patient.height || "168 cm" }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        {/* Patient Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm flex items-center justify-center border border-slate-200/80 dark:border-zinc-700 shrink-0 overflow-hidden">
            {patient.avatarUrl ? (
              <img src={patient.avatarUrl} alt={patient.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {patient.name}
              </h1>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal">
                • {patient.status || "Pre-Consultation"}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
              ID: {patient.patientId} {patient.email ? `• ${patient.email}` : ""}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 dark:text-zinc-500 font-normal">
          Walk-in OPD Telemetry
        </div>
      </div>

      {/* Secondary Demographic Row (Visually Subordinated per Withings hierarchy) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs text-slate-500 dark:text-zinc-400">
        {metrics.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
              {item.label}
            </span>
            <span className="text-sm font-medium text-slate-800 dark:text-zinc-200 mt-0.5">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
