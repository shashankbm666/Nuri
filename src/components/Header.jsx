import React from 'react';
import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header({ onOpenMobileMenu, patient, darkMode, setDarkMode }) {
  const initials = patient?.name
    ? patient.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'EV';

  return (
    <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Patient Health Telemetry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Connected Medical Monitor
          </p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Animated Theme Toggle Button in Header */}
        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          variant="button"
        />

        {/* Sensors Connected Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Sensors Connected</span>
        </div>

        {/* Patient Info (No doctor info) */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {patient?.name || 'Eleanor Vance'}
            </span>
            <span className="block text-[10px] font-medium text-slate-400">
              Patient (Self)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
