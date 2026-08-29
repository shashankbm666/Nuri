import React from 'react';
import { History, Heart, Activity, Thermometer, Clock, Sparkles } from 'lucide-react';

export default function ReadingHistory({ readings = [] }) {
  const getStatusBadge = (status, isLatest) => {
    let style = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (status === 'Review' || status === 'Elevated') {
      style = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    } else if (status === 'Critical') {
      style = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    } else if (status === 'Optimal') {
      style = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
        {status || 'Normal'}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-300">
      {/* Table Header / Title */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Vitals Measurement Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of captured biometric time-series
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
          {readings.length} records found
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-4 sm:px-6">Time Recorded</th>
              <th className="py-3.5 px-4 sm:px-6">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" /> Heart Rate
                </span>
              </th>
              <th className="py-3.5 px-4 sm:px-6">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" /> SpO2
                </span>
              </th>
              <th className="py-3.5 px-4 sm:px-6">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temperature
                </span>
              </th>
              <th className="py-3.5 px-4 sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {readings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm italic">
                  No previous readings logged. Click "Start New Reading" to begin.
                </td>
              </tr>
            ) : (
              readings.map((reading, index) => {
                const isLatest = index === 0;
                return (
                  <tr
                    key={reading.id || index}
                    className={`transition-colors duration-150 ${
                      isLatest
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-4 px-4 sm:px-6 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs sm:text-sm">{reading.timestamp}</span>
                        {isLatest && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                            <Sparkles className="w-3 h-3" /> Latest
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Heart Rate */}
                    <td className="py-4 px-4 sm:px-6 text-slate-800 dark:text-slate-200">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {reading.heartRate}
                      </span>{' '}
                      <span className="text-xs text-slate-400 dark:text-slate-500">bpm</span>
                    </td>

                    {/* SpO2 */}
                    <td className="py-4 px-4 sm:px-6 text-slate-800 dark:text-slate-200">
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                        {reading.spO2}
                      </span>{' '}
                      <span className="text-xs text-slate-400 dark:text-slate-500">%</span>
                    </td>

                    {/* Temperature */}
                    <td className="py-4 px-4 sm:px-6 text-slate-800 dark:text-slate-200">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {reading.temperature}
                      </span>{' '}
                      <span className="text-xs text-slate-400 dark:text-slate-500">°C</span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 sm:px-6">
                      {getStatusBadge(reading.status, isLatest)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
