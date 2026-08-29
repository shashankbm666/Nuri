import React from "react";
import Sparkline from "./Sparkline";

export default function VitalCard({
  title,
  subtitle,
  vitalData, // { value, status, level, note, history }
  unit,
  standardRange
}) {
  const hasReading = vitalData && vitalData.value !== undefined && vitalData.value !== null;
  const level = vitalData?.level || "green";

  // Semantic styles for status badge and highlights
  const semanticClasses = {
    green: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40"
    },
    amber: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40"
    },
    rose: {
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40"
    },
    muted: {
      text: "text-slate-400 dark:text-zinc-500",
      bg: "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
    }
  };

  const currentSemantic = semanticClasses[level] || semanticClasses.green;

  return (
    <div className="rounded-2xl p-6 transition-all duration-300 border flex flex-col justify-between min-h-[230px] bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div>
        {/* Top Header: Title, Sublabel, and Status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
              {subtitle}
            </p>
          </div>

          <div>
            {hasReading ? (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${currentSemantic.text} ${currentSemantic.bg}`}>
                {vitalData.status || "Normal"}
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/50">
                No record
              </span>
            )}
          </div>
        </div>

        {/* Hero Number & Measurement Value */}
        <div className="mt-5 mb-2">
          {hasReading ? (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-5xl font-semibold tracking-tight tabular-nums ${
                  level === "amber" || level === "rose" 
                    ? currentSemantic.text 
                    : "text-slate-900 dark:text-white"
                }`}>
                  {vitalData.value}
                </span>
                <span className="text-sm font-medium text-slate-400 dark:text-zinc-400 ml-0.5">
                  {unit}
                </span>
              </div>

              {/* Mini Sparkline Telemetry */}
              {vitalData.history && vitalData.history.length > 0 && (
                <div className="mt-3.5 mb-1">
                  <Sparkline data={vitalData.history} level={level} width={160} height={28} />
                </div>
              )}

              {/* Status Note (if elevated or out of range) */}
              {vitalData.note && (
                <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${currentSemantic.text}`}>
                  <span>•</span>
                  <span>{vitalData.note}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="py-2">
              <span className="text-4xl font-light text-slate-300 dark:text-zinc-700 tracking-tight font-mono">
                — —
              </span>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 font-normal">
                No reading recorded yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Standard Range */}
      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
        <span>Standard range</span>
        <span className="font-normal text-slate-500 dark:text-zinc-400">
          {standardRange}
        </span>
      </div>
    </div>
  );
}
