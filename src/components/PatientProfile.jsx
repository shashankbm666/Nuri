import React from 'react';
import {
  User,
  Calendar,
  Weight,
  Ruler,
  Clock,
  UserCheck
} from 'lucide-react';

export default function PatientProfile({ patient }) {
  if (!patient) return null;

  const initials = patient.name
    ? patient.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'EV';

  const details = [
    { label: 'Gender', value: patient.gender || 'Female', icon: User, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-100 dark:border-teal-900/40' },
    { label: 'Age', value: typeof patient.age === 'number' ? `${patient.age} yrs` : patient.age, icon: Calendar, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/40' },
    { label: 'Weight', value: patient.weight || '63 kg', icon: Weight, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/40' },
    { label: 'Height', value: patient.height || '168 cm', icon: Ruler, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-100 dark:border-cyan-900/40' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        {/* Patient Identity */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 ring-4 ring-teal-50 dark:ring-slate-800 shrink-0">
              {initials}
            </div>
            <span
              className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
              title="Patient Online"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {patient.name}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {patient.status || 'Pre-Consultation'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                ID: {patient.patientId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Info Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5">
        {details.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition"
            >
              <div className={`p-2.5 rounded-xl border ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.label}</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
