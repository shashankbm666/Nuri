import React from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Dedicated Animated ThemeToggle Component
 * Supports:
 * - Smooth rotation, scaling, and opacity transition between Sun and Moon
 * - Ambient dynamic glow (amber for light mode, cyan/indigo for dark mode)
 * - Tactile hover and active scales with smooth transition durations
 * - 'sidebar' and 'button' (header) display variants
 */
export default function ThemeToggle({
  darkMode,
  setDarkMode,
  variant = 'button',
  className = ''
}) {
  const toggleTheme = () => setDarkMode(!darkMode);

  if (variant === 'sidebar') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl p-3.5 transition-all duration-500 ${
          darkMode
            ? 'bg-slate-800/90 border border-slate-700/80 shadow-[0_0_25px_rgba(99,102,241,0.12)]'
            : 'bg-white/95 border border-slate-200/90 shadow-[0_0_25px_rgba(245,158,11,0.1)]'
        } ${className}`}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-all duration-700 pointer-events-none animate-glow-pulse ${
            darkMode ? 'bg-indigo-500/25' : 'bg-amber-400/20'
          }`}
        />

        <div className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Animated Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 relative ${
                darkMode
                  ? 'bg-indigo-950/80 text-cyan-300 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-amber-50 text-amber-500 ring-1 ring-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              }`}
            >
              <Sun
                className={`w-5 h-5 absolute transition-all duration-500 ease-out transform ${
                  darkMode
                    ? 'rotate-180 scale-0 opacity-0'
                    : 'rotate-0 scale-100 opacity-100 text-amber-500'
                }`}
              />
              <Moon
                className={`w-5 h-5 absolute transition-all duration-500 ease-out transform ${
                  darkMode
                    ? 'rotate-0 scale-100 opacity-100 text-cyan-300'
                    : '-rotate-180 scale-0 opacity-0'
                }`}
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                {darkMode ? 'Dark Theme' : 'Light Theme'}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {darkMode ? 'Night Eye-Care' : 'Day High-Contrast'}
              </span>
            </div>
          </div>

          {/* Interactive Toggle Switch Button */}
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            aria-label="Toggle theme mode"
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-500 ease-out focus:outline-hidden focus:ring-2 focus:ring-offset-2 active:scale-95 ${
              darkMode
                ? 'bg-gradient-to-r from-indigo-600 via-teal-600 to-cyan-500 focus:ring-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 focus:ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
            }`}
          >
            <span
              className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full shadow-md transform transition-all duration-500 ease-out ${
                darkMode
                  ? 'translate-x-5 bg-slate-900 text-cyan-300'
                  : 'translate-x-0 bg-white text-amber-500'
              }`}
            >
              <Sun
                className={`w-3.5 h-3.5 absolute transition-all duration-500 ease-out transform ${
                  darkMode ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
              />
              <Moon
                className={`w-3.5 h-3.5 absolute transition-all duration-500 ease-out transform ${
                  darkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Header / standalone icon button variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer select-none transition-all duration-500 ease-out active:scale-95 hover:scale-105 focus:outline-hidden ${
        darkMode
          ? 'bg-slate-800/90 text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 shadow-[0_0_16px_rgba(99,102,241,0.25)] hover:shadow-[0_0_24px_rgba(6,182,212,0.45)] ring-1 ring-cyan-500/20'
          : 'bg-white/90 text-amber-500 border border-slate-200/90 hover:border-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.2)] hover:shadow-[0_0_24px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/20'
      } ${className}`}
    >
      {/* Ambient background blur glow */}
      <span
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none ${
          darkMode ? 'bg-cyan-500/20' : 'bg-amber-400/25'
        }`}
      />

      {/* Sun Icon */}
      <Sun
        className={`w-5 h-5 transition-all duration-500 ease-out transform absolute ${
          darkMode
            ? 'rotate-180 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100 text-amber-500 group-hover:rotate-45'
        }`}
      />

      {/* Moon Icon */}
      <Moon
        className={`w-5 h-5 transition-all duration-500 ease-out transform absolute ${
          darkMode
            ? 'rotate-0 scale-100 opacity-100 text-cyan-300 group-hover:-rotate-12'
            : '-rotate-180 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
