import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, User, Stethoscope, ArrowRight, CheckCircle2 } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import DoctorPasswordModal from "../components/DoctorPasswordModal";
import { useAuth } from "../auth/AuthProvider";

export default function LandingPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, loginWithRedirect } = useAuth();
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const handlePatientClick = () => {
    if (isAuthenticated) {
      navigate("/patient/dashboard");
    } else {
      loginWithRedirect();
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-between p-4 sm:p-6 md:p-10 ${
      darkMode ? "dark bg-black text-zinc-100" : "bg-[#fbfbfd] text-slate-800"
    }`}>
      {/* Doctor password gate modal */}
      {showDoctorModal && (
        <DoctorPasswordModal
          darkMode={darkMode}
          onSuccess={() => {
            setShowDoctorModal(false);
            navigate("/doctor/dashboard");
          }}
          onClose={() => setShowDoctorModal(false)}
        />
      )}

      {/* Top Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold">
            <HeartPulse className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base text-slate-900 dark:text-white tracking-tight">
            Nuri
          </span>
        </div>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} variant="button" />
      </div>

      {/* Main Centered Card */}
      <div className="w-full max-w-xl mx-auto my-auto py-8">
        <div className={`rounded-2xl p-6 sm:p-10 border transition-all duration-300 ${
          darkMode
            ? "bg-zinc-900/90 border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.4)] text-zinc-100"
            : "bg-white border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-slate-800"
        }`}>
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Nuri Telemetry Station
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-zinc-400 mt-2 max-w-sm mx-auto font-normal">
              Select your role to access the outpatient telemetry system
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Option */}
            <button
              onClick={handlePatientClick}
              className={`group text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                darkMode
                  ? "bg-zinc-800/50 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-500"
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-200/70 dark:bg-zinc-700/60 text-slate-800 dark:text-zinc-200 flex items-center justify-center font-bold">
                  {isAuthenticated && user?.picture ? (
                    <img src={user.picture} alt="Profile" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">I'm a Patient</h3>
                  {isAuthenticated && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Logged In
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1 font-normal leading-relaxed">
                  {isAuthenticated
                    ? `Continue as ${user?.name || "Patient"}`
                    : "Auth0 Login / Signup before consultation check-in"}
                </p>
              </div>
            </button>

            {/* Doctor Option — opens password gate modal */}
            <button
              onClick={() => setShowDoctorModal(true)}
              className={`group text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                darkMode
                  ? "bg-zinc-800/50 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-500"
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-200/70 dark:bg-zinc-700/60 text-slate-800 dark:text-zinc-200 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">I'm a Doctor</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1 font-normal leading-relaxed">
                  View OPD patient queue and live telemetry records
                </p>
              </div>
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-zinc-800/80 text-center text-xs text-slate-400 dark:text-zinc-500 font-normal flex items-center justify-center gap-1.5">
            <span>Auth0 Secured</span>
            <span>•</span>
            <span>HIPAA Compliant</span>
            <span>•</span>
            <span>256-Bit Encrypted</span>
          </div>
        </div>
      </div>

      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-slate-400 dark:text-zinc-600 py-2">
        Nuri Telemetry Systems • Outpatient Pre-Consultation Station
      </footer>
    </div>
  );
}
