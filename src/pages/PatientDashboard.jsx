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
import { ClipboardList, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

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
          // Returning user — load their persisted profile
          const { data } = await res.json();
          const profile = {
            patientId: generatePatientId(user.sub),
            auth0Sub: user.sub,
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

          // Sync into doctor queue (triage may already exist in service)
          const triage = getPatientTriageSurvey(profile.patientId);
          if (triage) {
            registerOrUpdatePatientInQueue({
              profile,
              triageRecord: triage,
              vitals: getLatestVitalsForPatient(profile.patientId),
            });
          }
        } else if (res.status === 404) {
          // New user — placeholder profile; onboarding modal will complete it
          setPatient({
            patientId: generatePatientId(user.sub),
            auth0Sub: user.sub,
            name: "",
            email: user.email || "",
            avatarUrl: user.picture || null,
            gender: "—",
            age: "—",
            weight: "—",
            height: "—",
            status: "Pre-Consultation",
            registeredAt: null,
          });
          setShowOnboarding(true);
        } else {
          console.error("[PatientDashboard] Backend error:", res.status);
          // Graceful fallback: show onboarding so user can still proceed
          setPatient({
            patientId: generatePatientId(user.sub),
            auth0Sub: user.sub,
            name: "",
            email: user.email || "",
            avatarUrl: user.picture || null,
            gender: "—",
            age: "—",
            weight: "—",
            height: "—",
            status: "Pre-Consultation",
            registeredAt: null,
          });
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("[PatientDashboard] Could not reach backend:", err.message);
        // Network error — graceful fallback
        setPatient({
          patientId: generatePatientId(user.sub),
          auth0Sub: user.sub,
          name: "",
          email: user.email || "",
          avatarUrl: user.picture || null,
          gender: "—",
          age: "—",
          weight: "—",
          height: "—",
          status: "Pre-Consultation",
          registeredAt: null,
        });
        setShowOnboarding(true);
      } finally {
        setProfileLoading(false);
      }
    };

    checkBackend();
  }, [user?.sub]);

  const [triageRecord, setTriageRecord] = useState(null);

  // Load triage once patient profile is set
  useEffect(() => {
    if (patient?.patientId) {
      const survey = getPatientTriageSurvey(patient.patientId);
      setTriageRecord(survey);
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

  const handleSurveyComplete = (record) => {
    setTriageRecord(record);
    registerOrUpdatePatientInQueue({
      profile: patient,
      triageRecord: record,
      vitals: getLatestVitalsForPatient(patient.patientId),
    });
    setActiveTab("dashboard");
  };

  const latestReading = patient ? getLatestVitalsForPatient(patient.patientId) : null;

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
