import React from 'react';
import { Loader2, Radio, Zap, Activity } from 'lucide-react';

export default function StartReadingBtn({ onStartReading, isCapturing }) {
  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isCapturing}
        onClick={onStartReading}
        className={`w-full relative overflow-hidden group flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-md ${
          isCapturing
            ? 'bg-teal-700 text-white cursor-wait shadow-teal-500/20'
            : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:via-emerald-500 hover:to-cyan-500 text-white hover:shadow-xl hover:shadow-teal-500/25 active:scale-[0.99] cursor-pointer'
        }`}
      >
        {/* Glow effect behind button */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {isCapturing ? (
          <div className="flex items-center gap-3 z-10 text-left">
            <Loader2 className="w-6 h-6 animate-spin text-white shrink-0" />
            <div>
              <span className="block leading-tight font-semibold text-sm sm:text-base">
                Awaiting Telemetry Capture...
              </span>
              <span className="block text-xs font-normal text-teal-100 animate-pulse">
                Place finger firmly on the sensor
              </span>
            </div>
            <div className="relative flex h-3 w-3 ml-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full max-w-md z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <span className="tracking-wide text-base sm:text-lg font-bold">Start New Reading</span>
            <Radio className="w-6 h-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </div>
        )}
      </button>

      {/* Radar scanning indicator during capture */}
      {isCapturing && (
        <div className="mt-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between text-xs text-teal-800 dark:text-teal-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-bounce" />
            <span>Biometric sensor interface active: 250Hz sampling stream in progress...</span>
          </div>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded">
            CAPTURING
          </span>
        </div>
      )}
    </div>
  );
}
