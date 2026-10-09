import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import PatientProfile from "../components/PatientProfile";
import VitalsGrid from "../components/VitalsGrid";
import SymptomSurvey from "../components/SymptomSurvey";
import PatientOnboardingModal, { generatePatientId } from "../components/PatientOnboardingModal";
import { getLatestVitalsForPatient } from "../services/vitalsService";
import { getPatientTriageSurvey } from "../services/triageService";
import { useAuth } from "../auth/AuthProvider";
import { useOpd } from "../context/OpdContext";
import { ClipboardList, CheckCircle2, ChevronRight, Loader2, MapPin, AlertCircle } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function PatientDashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { registerOrUpdatePatientInQueue } = useOpd();
  const hasFetchedRef = useRef(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Patient profile — null until backend check resolves
  const [patient, setPatient] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  /**
   * On mount: check backend for an existing patient record keyed to Auth0 sub.
   * - Found (200)  → load their real saved profile, skip onboarding.
   * - Not found (404) → show the onboarding modal so they register once.
   * This prevents duplicate registrations on every login.
   */
  useEffect(() => {
    if (!user?.sub || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const checkBackend = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/patients/${encodeURIComponent(user.sub)}`);

        if (res.ok) {
          // ── Returning user — load their persisted DB profile ──────────────
          const { data } = await res.json();
          const profile = {
            patientId: generatePatientId(user.sub),
            auth0Sub: user.sub,
            dbId: data.id,
            name: data.full_name,
            email: data.email,
            avatarUrl: user.picture || null,
            gender: data.gender || "—",
            age: data.age || "—",
            weight: data.weight_kg ? `${data.weight_kg} kg` : "—",
            height: data.height_cm ? `${data.height_cm} cm` : "—",
            status: "Pre-Consultation",
            registeredAt: data.created_at,
          };
          setPatient(profile);
          setShowOnboarding(false);

          // Sync into doctor queue
          registerOrUpdatePatientInQueue({ profile, triageRecord: null, vitals: null });

          // ── Check for existing seat (persists across refresh) ──────────────
          try {
            const seatRes = await fetch(`${BACKEND_URL}/api/seats/current/${data.id}`);
            if (seatRes.ok) {
              const seatJson = await seatRes.json();
              setSeatInfo({ seat: seatJson.data.name, already_assigned: true });
              // Has a seat → go straight to dashboard to show it
              setActiveTab("dashboard");
            } else {
              // No seat yet → go to survey so they get one
              setActiveTab("survey");
            }
          } catch {
            // Seat lookup failed silently — still go to survey
            setActiveTab("survey");
          }

        } else if (res.status === 404) {
          // ── Brand new user — show onboarding to collect height/weight ──────
          setPatient({
            patientId: generatePatientId(user.sub),
            auth0Sub: user.sub,
            name: user.name || "",
            email: user.email || "",
            avatarUrl: user.picture || null,
            gender: "—", age: "—", weight: "—", height: "—",
            status: "Pre-Consultation",
            registeredAt: null,
          });
          setShowOnboarding(true);

        } else {
          // ── Backend error (500 etc.) — DO NOT show onboarding ─────────────
          // Profile likely exists in DB but backend is temporarily broken.
          // Load from Auth0 data so user can still use the app.
          console.warn("[PatientDashboard] Backend error:", res.status, "— loading from Auth0");
          setPatient({
            patientId: generatePatientId(user.sub),
            auth0Sub: user.sub,
            dbId: null,
            name: user.name || user.nickname || "Patient",
            email: user.email || "",
            avatarUrl: user.picture || null,
            gender: "—", age: "—", weight: "—", height: "—",
            status: "Pre-Consultation",
            registeredAt: null,
          });
          setShowOnboarding(false); // ← KEY FIX: no re-registration on 500
          setActiveTab("survey");
        }
      } catch (err) {
        // ── Network error (backend unreachable) — same as above, no onboarding
        console.warn("[PatientDashboard] Cannot reach backend:", err.message);
        setPatient({
          patientId: generatePatientId(user.sub),
          auth0Sub: user.sub,
          dbId: null,
          name: user.name || user.nickname || "Patient",
          email: user.email || "",
          avatarUrl: user.picture || null,
          gender: "—", age: "—", weight: "—", height: "—",
          status: "Pre-Consultation",
          registeredAt: null,
        });
        setShowOnboarding(false); // ← KEY FIX: no re-registration on network error
        setActiveTab("survey");
      } finally {
        setProfileLoading(false);
      }
    };

    checkBackend();
  }, [user?.sub]);

  const [triageRecord, setTriageRecord] = useState(null);
  const [seatInfo, setSeatInfo] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatError, setSeatError] = useState(null);

  // Survey is always cleared on login — fresh survey every visit.
  // Profile (height/weight) is asked only once (onboarding).
  useEffect(() => {
    if (patient?.patientId) {
      // Clear any previous triage so user must fill it again this session
      localStorage.removeItem(`nuri_patient_triage_${patient.patientId}`);
      setTriageRecord(null);
    }
  }, [patient?.patientId]);

  /**
   * Onboarding complete: persist new profile to backend (POST /api/patients),
   * then enter the app. Backend enforces unique auth0_sub — no duplicates possible.
   */
  const handleOnboardingComplete = async (newProfile) => {
    setPatient(newProfile);
    setShowOnboarding(false);

    // Persist to PostgreSQL
    try {
      const res = await fetch(`${BACKEND_URL}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0_sub: newProfile.auth0Sub,
          full_name: newProfile.name,
          email: newProfile.email,
          gender: newProfile.gender,
          age: parseInt(newProfile.age) || null,
          weight_kg: parseFloat(newProfile.weight) || null,
          height_cm: parseFloat(newProfile.height) || null,
        }),
      });

      if (!res.ok && res.status !== 409) {
        // 409 = duplicate (shouldn't happen given the GET check above, but safe to ignore)
        console.warn("[PatientDashboard] POST /api/patients returned:", res.status);
      }
    } catch (err) {
      console.error("[PatientDashboard] Failed to persist profile:", err.message);
    }

    // Register into Doctor OPD queue
    registerOrUpdatePatientInQueue({
      profile: newProfile,
      triageRecord: null,
      vitals: null,
    });

    setActiveTab("survey");
  };

  const handleSurveyComplete = async (record) => {
    setTriageRecord(record);
    registerOrUpdatePatientInQueue({
      profile: patient,
      triageRecord: record,
      vitals: getLatestVitalsForPatient(patient.patientId),
    });

    // Auto-assign a seat based on computed triage priority
    setSeatLoading(true);
    setSeatError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/seats/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0_sub: patient.auth0Sub,
          priority: record.computedPriority,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSeatInfo({ seat: json.seat, job_id: json.job_id, already_assigned: json.already_assigned });
      } else if (res.status === 409) {
        setSeatError("All seats are currently occupied. Please wait and inform the front desk.");
      } else {
        setSeatError("Could not assign a seat right now. Please inform the front desk.");
      }
    } catch {
      setSeatError("Could not reach server. Please inform the front desk.");
    } finally {
      setSeatLoading(false);
    }

    setActiveTab("dashboard");
  };

  const [dbReading, setDbReading] = useState(null);

  // Poll database for live vitals readings recorded by ESP32 / Robot
  useEffect(() => {
    if (!patient?.auth0Sub) return;

    const fetchPatientReadings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/patients/${encodeURIComponent(patient.auth0Sub)}/readings?limit=1`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const r = json.data[0];
            const date = new Date(r.timestamp);
            setDbReading({
              heartRate: Math.round(r.heart_rate),
              spO2: Math.round(r.spo2),
              temperature: parseFloat(r.temperature).toFixed(1),
              syncedAgoText: "Recorded " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              timestamp: date.toISOString(),
            });
          }
        }
      } catch {
        // Silent fail
      }
    };

    fetchPatientReadings();
    const interval = setInterval(fetchPatientReadings, 5000);
    return () => clearInterval(interval);
  }, [patient?.auth0Sub]);

  const latestReading = dbReading || (patient ? getLatestVitalsForPatient(patient.patientId) : null);

  const handleLogout = () => {
    if (logout) logout();
    else navigate("/");
  };

  // Loading state while backend check runs
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex ${
      darkMode ? "dark bg-black text-zinc-100" : "bg-[#fbfbfd] text-slate-800"
    }`}>
      {/* Onboarding Modal — shown only on first login */}
      {showOnboarding && (
        <PatientOnboardingModal
          user={user}
          onComplete={handleOnboardingComplete}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          patient={patient}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setMobileOpen={setMobileOpen}
          onSwitchRole={handleLogout}
          sensorConnected={true}
          lastSyncedText={latestReading ? latestReading.syncedAgoText : "No reading on file"}
        />

        <main className="p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6 flex-1">
          {activeTab === "dashboard" ? (
            <>
              <PatientProfile patient={patient} />

              {/* ══════════ SEAT ASSIGNMENT CARD (most prominent element) ══════════ */}
              {seatLoading ? (
                <div className={`rounded-2xl p-5 border flex items-center gap-3 ${
                  darkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-slate-200/90 shadow-2xs"
                }`}>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-zinc-400">Assigning your seat…</p>
                </div>
              ) : seatInfo ? (
                /* ── Seat Assigned ── */
                <div className={`rounded-2xl overflow-hidden border ${
                  darkMode ? "border-indigo-800/50" : "border-indigo-200"
                }`}>
                  {/* Top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

                  <div className={`p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 ${
                    darkMode ? "bg-indigo-950/30" : "bg-indigo-50/60"
                  }`}>
                    {/* Giant seat number badge */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="w-24 h-24 rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-500/30 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-0.5">Seat</span>
                        <span className="text-5xl font-black text-white leading-none tracking-tight">{seatInfo.seat}</span>
                      </div>
                      {/* Live pulsing indicator */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Assigned</span>
                      </div>
                    </div>

                    {/* Info block */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                        Your assigned seat is{" "}
                        <span className="text-indigo-600 dark:text-indigo-400">{seatInfo.seat}</span>
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Please proceed to seat <strong className="text-slate-700 dark:text-zinc-200">{seatInfo.seat}</strong> in the waiting area. NURI will navigate to your seat, collect your vitals, and return automatically.
                      </p>

                      {/* Status pills */}
                      <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          <MapPin className="w-3 h-3" /> Seat {seatInfo.seat}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50 text-xs font-semibold text-violet-700 dark:text-violet-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                          🤖 Robot en route
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          ID: {patient?.patientId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : seatError ? (
                /* ── Seat Error ── */
                <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
                  darkMode ? "bg-zinc-900/80 border-amber-800/40" : "bg-amber-50 border-amber-200"
                }`}>
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Seat Assignment Unavailable</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{seatError}</p>
                  </div>
                </div>
              ) : triageRecord ? (
                /* ── Survey done but no seat yet (shouldn't normally happen) ── */
                <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
                  darkMode ? "bg-zinc-900/80 border-zinc-700" : "bg-slate-50 border-slate-200"
                }`}>
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Seat assignment pending… Please wait or inform front desk.</p>
                </div>
              ) : null}

              {/* Symptom Survey Status Card */}
              <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                darkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-slate-200/90 shadow-2xs"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      triageRecord
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                    }`}>
                      {triageRecord ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {triageRecord ? "Symptom Survey Recorded" : "Pre-Consultation Symptom Survey"}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                        {triageRecord
                          ? `Primary concern: ${triageRecord.chiefComplaint} • Recorded ${triageRecord.submittedAt}`
                          : "Complete a 4-step health screening to assist your OPD physician"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("survey")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
                      triageRecord
                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                        : "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white shadow-2xs"
                    }`}
                  >
                    <span>{triageRecord ? "Review / Update Survey" : "Start Survey"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <VitalsGrid latestReading={latestReading} />
            </>
          ) : activeTab === "survey" ? (
            <SymptomSurvey
              patientId={patient?.patientId}
              onComplete={handleSurveyComplete}
              onCancel={() => setActiveTab("dashboard")}
            />
          ) : (
            <div className={`rounded-2xl p-12 text-center border ${
              darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-slate-200 text-slate-600"
            }`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize mb-2">
                {activeTab.replace("-", " ")}
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
                Reports and appointment details will be available post-consultation once your OPD physician review is complete.
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="mt-5 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl text-xs font-medium cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </main>

        <footer className="px-6 py-4 text-center text-xs text-slate-400 dark:text-zinc-600 border-t border-slate-100 dark:border-zinc-900">
          Nuri Telemetry Systems • Outpatient Pre-Consultation Station • Auth0 Secured • HIPAA Compliant
        </footer>
      </div>
    </div>
  );
}
