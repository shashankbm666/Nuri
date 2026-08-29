import React, { useState, useEffect } from "react";
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
import { ClipboardList, CheckCircle2, ChevronRight } from "lucide-react";

export default function PatientDashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { registerOrUpdatePatientInQueue } = useOpd();

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'survey' | 'appointments' | etc.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize or load patient profile strictly from Auth0 user + saved onboarding
  const [patient, setPatient] = useState(() => {
    if (user?.sub) {
      const saved = localStorage.getItem(`nuri_patient_profile_${user.sub}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved profile", e);
        }
      }
    }
    const freshId = generatePatientId(user?.sub);
    return {
      patientId: freshId,
      auth0Sub: user?.sub || null,
      name: user?.name || user?.nickname || "Patient",
      email: user?.email || "",
      avatarUrl: user?.picture || null,
      gender: "—",
      age: "—",
      weight: "—",
      height: "—",
      status: "Pre-Consultation",
      registeredAt: "Just now"
    };
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user?.sub) {
      const saved = localStorage.getItem(`nuri_patient_profile_${user.sub}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPatient(parsed);
          setShowOnboarding(false);
        } catch (e) {
          setShowOnboarding(true);
        }
      } else {
        // First login: trigger onboarding form
        setShowOnboarding(true);
      }
    }
  }, [user?.sub]);

  const [triageRecord, setTriageRecord] = useState(() => getPatientTriageSurvey(patient.patientId));

  // Sync triage survey if patient ID changes
  useEffect(() => {
    if (patient?.patientId) {
      const survey = getPatientTriageSurvey(patient.patientId);
      setTriageRecord(survey);
      // Sync to shared OPD Doctor queue
      if (survey) {
        registerOrUpdatePatientInQueue({
          profile: patient,
          triageRecord: survey,
          vitals: getLatestVitalsForPatient(patient.patientId)
        });
      }
    }
  }, [patient?.patientId]);

  // When first-time onboarding is completed: transition directly to the Symptom Survey step!
  const handleOnboardingComplete = (newProfile) => {
    setPatient(newProfile);
    setShowOnboarding(false);
    
    // Register initial profile into Doctor queue simulation
    registerOrUpdatePatientInQueue({
      profile: newProfile,
      triageRecord: triageRecord,
      vitals: getLatestVitalsForPatient(newProfile.patientId)
    });

    // Strict sequence: Onboarding Form -> Symptom Survey -> Dashboard
    setActiveTab("survey");
  };

  const handleSurveyComplete = (record) => {
    setTriageRecord(record);
    
    // Bridge to Doctor OPD Queue: Update patient's real Auth0 profile & survey-computed priority
    registerOrUpdatePatientInQueue({
      profile: patient,
      triageRecord: record,
      vitals: getLatestVitalsForPatient(patient.patientId)
    });

    // Step 3 in post-login flow: Transition to Dashboard upon survey completion
    setActiveTab("dashboard");
  };

  // Read-only latest stored reading for this specific patient
  const latestReading = getLatestVitalsForPatient(patient.patientId);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      navigate("/");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex ${
      darkMode ? "dark bg-black text-zinc-100" : "bg-[#fbfbfd] text-slate-800"
    }`}>
      {/* Step 1 in post-login flow: Onboarding Modal for First Login */}
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
              {/* Patient Demographics Card */}
              <PatientProfile 
                patient={patient} 
              />

              {/* Pre-Consultation Symptom Survey Status Card */}
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

              {/* 3 Static Vitals Telemetry Cards (Read-only display of latest stored reading) */}
              <VitalsGrid 
                latestReading={latestReading}
              />
            </>
          ) : activeTab === "survey" ? (
            /* Step 2 in post-login flow: Symptom Survey */
            <SymptomSurvey 
              patientId={patient.patientId}
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
