import React, { useState, useRef, useEffect } from "react";
import { Stethoscope, Eye, EyeOff, X, Lock, AlertCircle } from "lucide-react";
import { useDoctorAuth } from "../auth/DoctorAuthContext";

/**
 * DoctorPasswordModal
 *
 * Shared admin password gate for the Doctor workstation.
 * Shown when "I'm a Doctor" is clicked on the landing page.
 * On success: calls onSuccess() to navigate to /doctor/dashboard.
 * On cancel: calls onClose().
 */
export default function DoctorPasswordModal({ onSuccess, onClose, darkMode }) {
  const { attemptLogin } = useDoctorAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = attemptLogin(password);
    if (ok) {
      setError("");
      onSuccess();
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
      // Brief shake animation to signal wrong password
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      {/* Modal card */}
      <div
        className={`relative w-full max-w-sm rounded-2xl p-7 shadow-2xl border transition-all duration-300
          ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""}
          ${darkMode
            ? "bg-zinc-900 border-zinc-800 text-zinc-100"
            : "bg-white border-slate-200 text-slate-800"
          }`}
        style={shaking ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4
            ${darkMode ? "bg-zinc-800 text-zinc-300" : "bg-slate-100 text-slate-700"}`}>
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Doctor Workstation
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1.5 max-w-[220px] leading-relaxed">
            Enter the shared access password to view the OPD queue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter access password"
              autoComplete="current-password"
              className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border outline-none transition-all
                ${error
                  ? "border-red-400 dark:border-red-600 focus:ring-1 focus:ring-red-400/40"
                  : "border-slate-200 dark:border-zinc-700 focus:border-slate-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-slate-300/40 dark:focus:ring-zinc-600/30"
                }
                ${darkMode
                  ? "bg-zinc-800 text-zinc-100 placeholder-zinc-500"
                  : "bg-slate-50 text-slate-900 placeholder-slate-400"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
              bg-slate-900 text-white hover:bg-slate-700
              dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Access Workstation
          </button>
        </form>
      </div>

      {/* Shake keyframe injected inline (no extra CSS file needed) */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
