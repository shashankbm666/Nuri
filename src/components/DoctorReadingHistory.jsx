import React from "react";
import { History, AlertCircle, CheckCircle2 } from "lucide-react";

export default function DoctorReadingHistory({ history = [], darkMode }) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl p-8 border border-slate-200/90 dark:border-slate-800 text-center space-y-2 bg-white dark:bg-slate-900 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <History className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          No Past Telemetry Records
        </h4>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs mx-auto">
          Past telemetry logs and consultation visit timestamps will appear here.
        </p>
      </div>
    );
  }

  // Sorted most recent first
  const sortedHistory = [...history];

  const isOutOfRange = (item) => {
    return (
      item.heartRate < 60 ||
      item.heartRate > 100 ||
      item.spO2 < 95 ||
      item.temperature < 36.1 ||
      item.temperature > 37.2 ||
      item.status === "Attention" ||
      item.status === "Elevated"
    );
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Telemetry Reading History
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {sortedHistory.length} Total Visits
        </span>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Timestamp / Date</th>
              <th className="py-2.5 px-3">Heart Rate (bpm)</th>
              <th className="py-2.5 px-3">Oxygen SpO2 (%)</th>
              <th className="py-2.5 px-3">Temperature (°C)</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {sortedHistory.map((item, index) => {
              const abnormal = isOutOfRange(item);
              const hrAbnormal = item.heartRate < 60 || item.heartRate > 100;
              const spO2Abnormal = item.spO2 < 95;
              const tempAbnormal = item.temperature < 36.1 || item.temperature > 37.2;

              return (
                <tr
                  key={item.id || index}
                  className={`transition-colors ${
                    abnormal
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-amber-500 hover:bg-amber-50/70 dark:hover:bg-amber-950/30"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-3 text-slate-900 dark:text-slate-200 font-medium">
                    <span className="flex items-center gap-1.5">
                      {index === 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" title="Latest Reading" />
                      )}
                      <span>{item.timestamp}</span>
                    </span>
                  </td>

                  {/* Heart Rate */}
                  <td className="py-3 px-3 font-mono">
                    <span className={hrAbnormal ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                      {item.heartRate} bpm
                    </span>
                    {hrAbnormal && <span className="text-[10px] text-rose-500 ml-1 font-bold">(!)</span >}
                  </td>

                  {/* Oxygen SpO2 */}
                  <td className="py-3 px-3 font-mono">
                    <span className={spO2Abnormal ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                      {item.spO2}%
                    </span>
                    {spO2Abnormal && <span className="text-[10px] text-amber-500 ml-1 font-bold">(!)</span >}
                  </td>

                  {/* Temperature */}
                  <td className="py-3 px-3 font-mono">
                    <span className={tempAbnormal ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                      {item.temperature}°C
                    </span>
                    {tempAbnormal && <span className="text-[10px] text-amber-500 ml-1 font-bold">(!)</span >}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-right">
                    {abnormal ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <AlertCircle className="w-3 h-3" />
                        Attention
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" />
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
