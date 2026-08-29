import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

export default function VitalCard({
  title,
  subtitle,
  value,
  unit,
  standardRange,
  status = 'Normal',
  icon: IconComponent,
  theme = 'teal',
  isCapturing = false
}) {
  const themeStyles = {
    rose: {
      border: 'border-rose-100 dark:border-rose-900/40',
      bgGlow: 'from-rose-500/10 to-transparent',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      accentText: 'text-rose-600 dark:text-rose-400',
    },
    teal: {
      border: 'border-teal-100 dark:border-teal-900/40',
      bgGlow: 'from-teal-500/10 to-transparent',
      iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
      accentText: 'text-teal-600 dark:text-teal-400',
    },
    amber: {
      border: 'border-amber-100 dark:border-amber-900/40',
      bgGlow: 'from-amber-500/10 to-transparent',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      accentText: 'text-amber-600 dark:text-amber-400',
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles.teal;
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border ${currentTheme.border} shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
    >
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${currentTheme.bgGlow} rounded-full blur-2xl pointer-events-none`}
      />

      <div>
        {/* Header with Title, Subtitle, and Icon */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${currentTheme.iconBg}`}>
              <IconComponent className={`w-6 h-6 ${isCapturing ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {isCapturing ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
              Scanning
            </span>
          ) : hasValue ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {status || 'Normal'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3 h-3 text-slate-400" />
              Awaiting
            </span>
          )}
        </div>

        {/* Value Display / Shimmer / Placeholder */}
        <div className="my-3">
          {isCapturing ? (
            <div className="py-2 space-y-2 animate-pulse">
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : hasValue ? (
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold tracking-tight ${currentTheme.accentText}`}>
                {value}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {unit}
              </span>
            </div>
          ) : (
            <div className="py-1">
              <span className="text-3xl font-bold text-slate-300 dark:text-slate-600">--</span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                No reading captured yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Standard Range */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-slate-400 dark:text-slate-500">Standard range</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">
          {standardRange}
        </span>
      </div>
    </div>
  );
}
