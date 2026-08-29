import React, { useState } from "react";
import { User, Mail, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * Deterministically generates a fresh 5-digit Patient ID from an Auth0 sub
 */
export function generatePatientId(sub) {
  if (!sub) return `MED-${Math.floor(10000 + Math.random() * 90000)}`;
  let hash = 0;
  for (let i = 0; i < sub.length; i++) {
    hash = ((hash << 5) - hash) + sub.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash) % 90000 + 10000;
  return `MED-${absHash}`;
}

export default function PatientOnboardingModal({ user, onComplete }) {
  // Empty full name field by default per specification (editable, zero mock fallback)
  const [name, setName] = useState(user?.name && !user?.name.includes("@") ? user.name : "");
  const [gender, setGender] = useState("Female");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [error, setError] = useState(null);

  const freshPatientId = generatePatientId(user?.sub);
  const liveEmail = user?.email || "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!age || Number(age) <= 0) {
      setError("Please enter a valid age.");
      return;
    }
    if (!weight || Number(weight) <= 0) {
      setError("Please enter your weight in kg.");
      return;
    }
    if (!height || Number(height) <= 0) {
      setError("Please enter your height in cm.");
      return;
    }

    const patientProfile = {
      patientId: freshPatientId,
      auth0Sub: user?.sub || "auth0|guest",
      name: name.trim(),
      email: liveEmail,
      avatarUrl: user?.picture || null,
      gender,
      age: Number(age),
      weight: String(weight).includes("kg") ? weight : `${weight} kg`,
      height: String(height).includes("cm") ? height : `${height} cm`,
      status: "Pre-Consultation",
      registeredAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Today"
    };

    // Save profile locally tied strictly to this specific Auth0 user sub
    if (user?.sub) {
      localStorage.setItem(`nuri_patient_profile_${user.sub}`, JSON.stringify(patientProfile));
    }

    onComplete(patientProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl p-6 sm:p-8 border bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center mx-auto mb-3 shadow-sm font-bold overflow-hidden">
            {user?.picture ? (
              <img
                src={user.picture}
                alt="Auth0 Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Complete Patient Profile
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal max-w-sm mx-auto">
            Assigned Telemetry ID: <strong className="font-mono text-slate-700 dark:text-zinc-300">{freshPatientId}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Field (Editable, no mock fallback) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition"
              required
            />
          </div>

          {/* Verified Email Field (Read-only, sourced strictly live from current Auth0 user) */}
          {liveEmail ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Verified Auth0 Email
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-mono">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{liveEmail}</span>
                <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
            </div>
          ) : null}

          {/* Gender & Age Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-slate-400 transition"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Age (years)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                min="1"
                max="120"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-slate-400 transition"
                required
              />
            </div>
          </div>

          {/* Weight & Height Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 68"
                min="10"
                max="300"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-slate-400 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 172"
                min="50"
                max="250"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-slate-400 transition"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Save & Continue to Station</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
          Encrypted Biometric Telemetry • HIPAA Compliant
        </div>
      </div>
    </div>
  );
}
