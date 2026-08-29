import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Stethoscope, 
  Users, 
  Activity, 
  Heart, 
  Thermometer, 
  Radio, 
  ArrowLeft, 
  FileText,
  Search,
  X,
  AlertTriangle,
  Inbox,
  UserCheck
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import VitalsTrendChart from "../components/VitalsTrendChart";
import DoctorReadingHistory from "../components/DoctorReadingHistory";
import PatientTriageDetailCard from "../components/PatientTriageDetailCard";
import { useOpd } from "../context/OpdContext";
import { useDoctorAuth } from "../auth/DoctorAuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const READING_POLL_INTERVAL = 10000; // Poll every 10s for live readings

// MTS Triage Priority Weighting for Sorting
const PRIORITY_WEIGHTS = {
  red: 5,
  orange: 4,
  yellow: 3,
  green: 2,
  blue: 1
};


export default function DoctorDashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { patients: allPatients } = useOpd();
  const { logout: doctorLogout } = useDoctorAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [consultNotes, setConsultNotes] = useState("");

  // ── Backend readings state ─────────────────────────────────────────────────
  const [backendReadings, setBackendReadings] = useState([]);
  const pollRef = useRef(null);

  // Clear doctor session and return to landing page
  const handleSwitchRole = () => {
    doctorLogout();
    navigate("/");
  };


  // Queue patients sorted by priority tier first (Red -> Orange -> Yellow -> Green -> Blue), then by wait time
  const rawQueue = allPatients.filter(p => p.inQueue);
  const sortedQueue = [...rawQueue].sort((a, b) => {
    const priorityA = a.triage?.computedPriority || "blue";
    const priorityB = b.triage?.computedPriority || "blue";
    const weightDiff = PRIORITY_WEIGHTS[priorityB] - PRIORITY_WEIGHTS[priorityA];
    if (weightDiff !== 0) return weightDiff;
    return (b.timeWaitingMinutes || 0) - (a.timeWaitingMinutes || 0);
  });

  // Search filtered patients
  const searchResults = searchQuery.trim() === "" 
    ? [] 
    : allPatients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Selected patient resolves to explicitly selected ID, or top queue patient, or null
  const selectedPatient = selectedPatientId 
    ? allPatients.find(p => p.id === selectedPatientId) 
    : (sortedQueue[0] || allPatients[0] || null);

  // ── Fetch readings from backend for selected patient ───────────────────────
  const fetchReadings = useCallback(async (auth0Sub) => {
    if (!auth0Sub) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/patients/${encodeURIComponent(auth0Sub)}/readings?limit=50`);
      if (res.ok) {
        const json = await res.json();
        setBackendReadings(json.data || []);
      }
    } catch {
      // Silent fail — vitals just won't update this cycle
    }
  }, []);

  // When selectedPatient changes, fetch readings + start polling
  useEffect(() => {
    clearInterval(pollRef.current);
    setBackendReadings([]);

    const sub = selectedPatient?.auth0Sub;
    if (!sub) return;

    fetchReadings(sub);
    pollRef.current = setInterval(() => fetchReadings(sub), READING_POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [selectedPatient?.auth0Sub, fetchReadings]);

  // ── Derive vitals from backend readings ────────────────────────────────────
  // Latest reading → vitals cards; full array → chart + history table
  const latestReading = backendReadings.length > 0 ? backendReadings[0] : null;

  const derivedVitals = latestReading ? {
    heartRate: latestReading.heart_rate,
    spO2: latestReading.spo2,
    temperature: latestReading.temperature,
    recordedAt: new Date(latestReading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } : selectedPatient?.vitals || null;

  const derivedHistory = backendReadings.length > 0
    ? backendReadings.map(r => ({
        id: `read-${r.id}`,
        timestamp: new Date(r.timestamp).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }),
        heartRate: r.heart_rate,
        spO2: r.spo2,
        temperature: r.temperature,
        status: (r.heart_rate > 100 || r.heart_rate < 60 || r.spo2 < 95 || r.temperature > 37.5 || r.temperature < 36.0) ? "Abnormal" : "Normal"
      }))
    : (selectedPatient?.history || []);


  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
      darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50/80 text-slate-800"
    }`}>
      {/* Doctor Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
        darkMode ? "bg-slate-950/80 border-slate-800/80" : "bg-white/80 border-slate-200/80 shadow-2xs"
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSwitchRole}
            className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-colors ${
              darkMode ? "border-slate-800 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-100 text-slate-600"
            }`}
            title="Return to portal selection"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                OPD Physician Station
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Doctor
                </span>
              </h2>
              <p className="text-xs text-slate-400">Nuri Telemetry & Consultation Station</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Station Active</span>
          </div>

          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} variant="button" />
        </div>
      </header>

      {/* Main Doctor Dashboard Workspace */}
      <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Patient Search + Priority-Sorted OPD Queue */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient Search Section */}
          <div className={`rounded-2xl p-4 border transition-all ${
            darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
          }`}>
            <label htmlFor="patient-search-input" className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Patient Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                id="patient-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered patients"
                className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none transition-colors ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-400"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Results List */}
            {searchQuery.trim() !== "" && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Search Results ({searchResults.length})</span>
                  {searchResults.length > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Click to load</span>
                  )}
                </div>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No registered patients found matching "{searchQuery}"
                  </p>
                ) : (
                  searchResults.map((pat) => (
                    <button
                      key={pat.id}
                      onClick={() => {
                        setSelectedPatientId(pat.id);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between text-xs transition cursor-pointer ${
                        pat.id === selectedPatient?.id
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white"
                          : "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{pat.name}</span>
                        <span className="text-[11px] text-slate-400">{pat.id} • {pat.triage?.chiefComplaint || "General"}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pat.triage?.computedPriority === "red"
                            ? "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300"
                            : pat.triage?.computedPriority === "orange"
                              ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          {pat.triage?.computedPriority?.toUpperCase() || "PATIENT"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Priority-Sorted OPD Queue List */}
          <div className={`rounded-2xl p-5 border transition-all ${
            darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">OPD Triage Queue</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {sortedQueue.length} In Queue
              </span>
            </div>

            {sortedQueue.length === 0 ? (
              /* OPD Queue Empty State */
              <div className="py-8 px-4 text-center space-y-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  No Patients in Queue
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Registered walk-in patients will appear here in real-time as they complete their pre-consultation registration and symptom survey.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedQueue.map((pat) => {
                  const isSelected = pat.id === selectedPatient?.id;
                  const priority = pat.triage?.computedPriority || "green";
                  const isRed = priority === "red";
                  const isOrange = priority === "orange";
                  const isYellow = priority === "yellow";

                  // Visual escalation styling
                  const rowBorderClass = isRed
                    ? "border-l-4 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                    : isOrange
                      ? "border-l-4 border-amber-500"
                      : isYellow
                        ? "border-l-4 border-yellow-400"
                        : "border-l-4 border-transparent";

                  const rowBgClass = isSelected
                    ? isRed
                      ? "bg-rose-50/90 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700"
                      : isOrange
                        ? "bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700"
                        : "bg-slate-100/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 shadow-xs"
                    : isRed
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      : isOrange
                        ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        : darkMode
                          ? "bg-slate-800/50 border-slate-700/60 hover:bg-slate-800"
                          : "bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/80";

                  return (
                    <button
                      key={pat.id}
                      onClick={() => setSelectedPatientId(pat.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${rowBorderClass} ${rowBgClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isRed
                            ? "bg-rose-600 text-white shadow-xs animate-pulse"
                            : isOrange
                              ? "bg-amber-500 text-white shadow-xs"
                              : isSelected 
                                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs" 
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}>
                          {pat.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {pat.name}
                            </h4>
                            {isRed && (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                            )}
                            {isOrange && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          
                          {/* Chief complaint subtitle */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className={isRed ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-slate-600 dark:text-zinc-300"}>
                              {pat.triage?.chiefComplaint || "General Check-in"}
                            </span>
                            {" • "}
                            <span>{pat.id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isRed ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs tracking-wider uppercase inline-block">
                            URGENT
                          </span>
                        ) : isOrange ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs tracking-wider uppercase inline-block">
                            VERY URGENT
                          </span>
                        ) : isYellow ? (
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-700/50 inline-block">
                            Urgent
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                            Standard
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{pat.timeWaiting || "Just now"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Details + Triage Survey Card + Vitals Cards + Trend Chart + History Table + Notes */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <>
              {/* Selected Patient Header */}
              <div className={`rounded-2xl p-6 border transition-all ${
                darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden">
                      {selectedPatient.avatarUrl ? (
                        <img src={selectedPatient.avatarUrl} alt={selectedPatient.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedPatient.name.split(" ").map(n => n[0]).join("")
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPatient.name}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          ID: {selectedPatient.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedPatient.gender} • {selectedPatient.age} years old • {selectedPatient.inQueue ? "Walk-in OPD Queue" : "Registered Patient Record"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Captured:</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {derivedVitals ? derivedVitals.recordedAt : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Triage Symptom Survey Detail Card (Above vitals cards so symptom context is seen first) */}
              <PatientTriageDetailCard 
                surveyData={selectedPatient.triage} 
                darkMode={darkMode} 
              />

              {/* 2. Vitals Telemetry Triad */}
              {derivedVitals ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`rounded-2xl p-5 border transition-all ${
                    darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Heart Rate</span>
                      <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold font-mono ${
                        derivedVitals.heartRate < 60 || derivedVitals.heartRate > 100
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {derivedVitals.heartRate}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">bpm</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Electrocardiogram (60-100)</p>
                  </div>

                  <div className={`rounded-2xl p-5 border transition-all ${
                    darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Oxygen SpO2</span>
                      <Activity className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold font-mono ${
                        derivedVitals.spO2 < 95
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {derivedVitals.spO2}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Pulse Oximetry (95-100%)</p>
                  </div>

                  <div className={`rounded-2xl p-5 border transition-all ${
                    darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Temperature</span>
                      <Thermometer className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold font-mono ${
                        derivedVitals.temperature < 36.1 || derivedVitals.temperature > 37.2
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {derivedVitals.temperature}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">°C</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Infrared Sensor (36.1-37.2)</p>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-8 border text-center ${
                  darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <Radio className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No vitals reading recorded yet for this session.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Awaiting telemetry from patient sensor station...</p>
                </div>
              )}

              {/* 3. Longitudinal Vitals Trend Chart */}
              <VitalsTrendChart 
                history={derivedHistory} 
                darkMode={darkMode} 
              />

              {/* 4. Telemetry Reading History Table */}
              <DoctorReadingHistory 
                history={derivedHistory} 
                darkMode={darkMode} 
              />

              {/* 5. Clinical Assessment & Consultation Notes Area */}
              <div className={`rounded-2xl p-6 border transition-all ${
                darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/95 border-slate-200 shadow-xs"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Physician Clinical Assessment</h4>
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter clinical observations, diagnosis notes, and prescription advice..."
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  className={`w-full rounded-xl p-3.5 text-sm border outline-none transition-colors ${
                    darkMode 
                      ? "bg-slate-800/80 border-slate-700 text-slate-100 focus:border-slate-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-500"
                  }`}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                    Save Draft
                  </button>
                  <button className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm cursor-pointer">
                    Complete Consultation & Generate Report
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Selected Patient Empty State (When queue has 0 patients or none selected) */
            <div className={`rounded-2xl p-12 sm:p-16 border text-center space-y-4 transition-all ${
              darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                <UserCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  No Patient Selected
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed font-normal">
                  Patients will appear in the OPD Queue once they register and submit their symptom survey. Select a patient row to review their telemetry and triage records.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
