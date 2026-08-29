import React from "react";
import { Menu, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header({
  patient,
  darkMode,
  setDarkMode,
  setMobileOpen,
  onSwitchRole,
  sensorConnected = true,
  lastSyncedText = "Sensor idle"
}) {
  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md transition-colors duration-300 ${
      darkMode ? "bg-zinc-950/90 border-zinc-800/80" : "bg-white/90 border-slate-200/80"
    }`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight leading-none">
            Patient Telemetry
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal mt-1">
            {lastSyncedText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Subtle connection indicator (NOT a loud pill) */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-normal">
          <span className={`w-2 h-2 rounded-full ${
            sensorConnected ? "bg-emerald-500" : "bg-slate-400 dark:bg-zinc-600"
          }`} />
          <span className="hidden sm:inline">
            {sensorConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Minimal Sun / Moon Toggle */}
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} variant="button" />

        {/* Quiet User Role Switch */}
        {onSwitchRole && (
          <button
            onClick={onSwitchRole}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors ${
              darkMode 
                ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" 
                : "border-slate-200 hover:bg-slate-100 text-slate-600"
            }`}
            title="Switch portal or role"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Exit</span>
          </button>
        )}
      </div>
    </header>
  );
}
