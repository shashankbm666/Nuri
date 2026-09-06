import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio, Heart, Activity, Thermometer, Play, Square,
  AlertTriangle, CheckCircle2, Loader2, Wifi, WifiOff,
  BarChart2, ChevronDown, Zap
} from "lucide-react";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ESP32 SIMULATOR — TEMPORARY TESTING TOOL
 *  ⚠️  Remove this entire page once real ESP32 hardware is connected.
 *
 *  Two modes:
 *  1. Start/Stop Scan — sends unassigned readings every 2s (no patient_id)
 *  2. Generate Trend Data — sends 12 readings assigned to a chosen patient,
 *     spaced 4 minutes apart in timestamp, for testing the trend chart.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SCAN_INTERVAL_MS = 2000; // 2 seconds
const TREND_BATCH_COUNT = 12;
const TREND_SPACING_MINUTES = 4; // each reading 4 min apart in the past

// ── Reading generators ────────────────────────────────────────────────────────

/** Unassigned random reading. ~10% chance of one vital being out of range. */
function generateUnassignedReading() {
  const outOfRange = Math.random() < 0.1;
  let hr, spo2, temp;
  if (outOfRange) {
    const pick = Math.floor(Math.random() * 3);
    hr   = pick === 0 ? +(Math.random() * 40 + 110).toFixed(0) : +(Math.random() * 40 + 60).toFixed(0);
    spo2 = pick === 1 ? +(Math.random() * 8  + 85).toFixed(0)  : +(Math.random() * 5  + 95).toFixed(0);
    temp = pick === 2 ? +(Math.random() * 2  + 37.8).toFixed(1) : +(Math.random() * 1.1 + 36.1).toFixed(1);
  } else {
    hr   = +(Math.random() * 40 + 60).toFixed(0);
    spo2 = +(Math.random() * 5  + 95).toFixed(0);
    temp = +(Math.random() * 1.1 + 36.1).toFixed(1);
  }
  return { heart_rate: Number(hr), spo2: Number(spo2), temperature: Number(temp) };
}

/**
 * Generate a batch of TREND_BATCH_COUNT readings for a specific patient.
 * - Normal readings oscillate gently (HR 70-90, SpO2 96-99, Temp 36.3-36.9)
 * - Readings at index 3 and 9 are forced out-of-range to test chart alert markers
 * - Each reading has a timestamp spaced TREND_SPACING_MINUTES apart ending at now
 */
function generateTrendBatch() {
  const now = Date.now();
  return Array.from({ length: TREND_BATCH_COUNT }, (_, i) => {
    const minutesAgo = (TREND_BATCH_COUNT - 1 - i) * TREND_SPACING_MINUTES;
    const ts = new Date(now - minutesAgo * 60 * 1000).toISOString();

    // Force anomaly at index 3 (SpO2 low) and index 9 (HR high)
    const isLowSpO2 = i === 3;
    const isHighHR  = i === 9;

    const hr   = isHighHR  ? 115 + Math.round(Math.random() * 10)
                           : 70  + Math.round(Math.random() * 20); // 70-90
    const spo2 = isLowSpO2 ? 88  + Math.round(Math.random() * 4)  // 88-91 (low)
                           : 96  + Math.round(Math.random() * 3);  // 96-99
    const temp = +(36.3 + Math.random() * 0.6).toFixed(1);         // 36.3-36.9

    return { heart_rate: hr, spo2, temperature: temp, timestamp: ts };
  });
}

// ── Log entry renderer ────────────────────────────────────────────────────────
function LogEntry({ entry }) {
  const isAbnormal = entry.heart_rate &&
    (entry.heart_rate > 100 || entry.heart_rate < 60 || entry.spo2 < 95 ||
     entry.temperature > 37.5 || entry.temperature < 36.0);

  const rowClass = entry.status === "error"
    ? "bg-red-500/8 border border-red-500/20"
    : isAbnormal
      ? "bg-amber-500/8 border border-amber-500/20"
      : "bg-zinc-800/50 border border-zinc-800";

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${rowClass}`}>
      {entry.status === "ok"
        ? isAbnormal
          ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
        : <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
      }
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <div className="truncate">
          <span className="text-zinc-500 text-[10px]">{entry.ts}</span>
          {entry.label && <span className="ml-1.5 text-indigo-400 text-[10px]">[{entry.label}]</span>}
          {entry.status === "ok" ? (
            <span className="ml-2">
              <span className="text-rose-400"><Heart className="w-3 h-3 inline -mt-0.5" /> {entry.heart_rate}</span>
              <span className="text-zinc-600 mx-1">|</span>
              <span className="text-cyan-400"><Activity className="w-3 h-3 inline -mt-0.5" /> {entry.spo2}%</span>
              <span className="text-zinc-600 mx-1">|</span>
              <span className="text-amber-400"><Thermometer className="w-3 h-3 inline -mt-0.5" /> {entry.temperature}°C</span>
            </span>
          ) : (
            <span className="ml-2 text-red-400 text-[11px]">{entry.message}</span>
          )}
        </div>
        {entry.code != null && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
            entry.status === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {entry.code}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Esp32Simulator() {
  // ── Scan state (unassigned)
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef(null);

  // ── Trend state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(""); // postgres integer id as string
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [trendBusy, setTrendBusy] = useState(false);
  const [trendResult, setTrendResult] = useState(null); // { ok, sent, failed }
  const [loadingPatients, setLoadingPatients] = useState(true);

  // ── Shared log
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");
  const logEndRef = useRef(null);

  // Scroll log to bottom on new entries
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Fetch patient list on mount (need postgres ids for trend assignment)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/patients`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = json.data || [];
        setPatients(list);
        if (list.length > 0) setSelectedPatientId(String(list[0].id));
      } catch (err) {
        setError(`Failed to load patients: ${err.message}`);
      } finally {
        setLoadingPatients(false);
      }
    })();
  }, []);

  // ── Send one unassigned reading
  const sendUnassignedReading = useCallback(async () => {
    const reading = generateUnassignedReading();
    const ts = new Date().toLocaleTimeString();
    try {
      const res = await fetch(`${BACKEND_URL}/api/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reading, source: "simulator" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLog(prev => [...prev, { ts, status: "error", code: res.status, message: json.error || `HTTP ${res.status}`, ...reading }]);
      } else {
        setLog(prev => [...prev, { ts, status: "ok", code: res.status, ...reading }]);
      }
    } catch (err) {
      setLog(prev => [...prev, { ts, status: "error", code: 0, message: err.message, ...reading }]);
    }
  }, []);

  const handleStart = useCallback(() => {
    setError("");
    setScanning(true);
    sendUnassignedReading();
    intervalRef.current = setInterval(sendUnassignedReading, SCAN_INTERVAL_MS);
  }, [sendUnassignedReading]);

  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  // ── Generate Trend Batch
  const handleGenerateTrend = useCallback(async () => {
    if (!selectedPatientId) { setError("Select a patient for trend generation"); return; }
    setError("");
    setTrendBusy(true);
    setTrendResult(null);

    const batch = generateTrendBatch();
    let sent = 0;
    let failed = 0;

    for (const reading of batch) {
      const ts = new Date(reading.timestamp).toLocaleTimeString();
      try {
        const res = await fetch(`${BACKEND_URL}/api/readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: Number(selectedPatientId),
            heart_rate: reading.heart_rate,
            spo2: reading.spo2,
            temperature: reading.temperature,
            source: "trend_batch",
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          failed++;
          setLog(prev => [...prev, { ts, status: "error", code: res.status, message: json.error || `HTTP ${res.status}`, label: "TREND", ...reading }]);
        } else {
          sent++;
          setLog(prev => [...prev, { ts, status: "ok", code: res.status, label: "TREND", ...reading }]);
        }
      } catch (err) {
        failed++;
        setLog(prev => [...prev, { ts: new Date().toLocaleTimeString(), status: "error", code: 0, message: err.message, label: "TREND", ...reading }]);
      }
    }

    setTrendBusy(false);
    setTrendResult({ sent, failed });
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => String(p.id) === selectedPatientId);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Radio className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              ESP32 Telemetry Simulator
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Dev Tool
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">
              ⚠️ Temporary — remove when real hardware is connected
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          scanning
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500"
        }`}>
          {scanning ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
          {scanning ? "Transmitting" : "Idle"}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-5">

        {/* ── Section 1: Unassigned Scan ──────────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div>
            <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Unassigned Scan</h2>
            <p className="text-[11px] text-zinc-500">
              Sends readings with no patient_id every {SCAN_INTERVAL_MS / 1000}s — appears in Doctor Dashboard "Unassigned Readings" panel for manual assignment.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer
                bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {scanning ? "Scanning…" : "Start Scan"}
            </button>
            <button
              onClick={handleStop}
              disabled={!scanning}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer
                bg-red-600 hover:bg-red-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </div>
        </div>

        {/* ── Section 2: Trend Data Generator ─────────────────────────────── */}
        <div className="rounded-2xl border border-indigo-800/50 bg-indigo-950/20 p-5 space-y-4">
          <div>
            <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              Generate Trend Data
            </h2>
            <p className="text-[11px] text-zinc-500">
              Instantly POSTs {TREND_BATCH_COUNT} readings assigned to a patient, timestamped {TREND_SPACING_MINUTES} min apart — creates a realistic multi-point trend chart. Readings at positions 4 and 10 are intentionally out-of-range to test alert markers.
            </p>
          </div>

          {/* Patient selector */}
          {loadingPatients ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading patients…
            </div>
          ) : patients.length === 0 ? (
            <p className="text-sm text-zinc-400">No registered patients found.</p>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                disabled={trendBusy}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-800/50 text-sm text-left disabled:opacity-50 hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <span className="text-zinc-200">
                  {selectedPatient ? `${selectedPatient.full_name}` : "Select a patient…"}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl max-h-48 overflow-y-auto">
                  {patients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatientId(String(p.id)); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors cursor-pointer ${
                        String(p.id) === selectedPatientId ? "bg-zinc-800 text-white" : "text-zinc-300"
                      }`}
                    >
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-zinc-500 ml-2 text-xs">{p.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate button + result */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateTrend}
              disabled={trendBusy || !selectedPatientId || loadingPatients}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer
                bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {trendBusy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending batch…</>
                : <><Zap className="w-4 h-4" /> Generate Trend Data</>
              }
            </button>

            {trendResult && !trendBusy && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                trendResult.failed === 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {trendResult.sent}/{TREND_BATCH_COUNT} sent
                {trendResult.failed > 0 && `, ${trendResult.failed} failed`}
              </span>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── Shared Transmission Log ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Transmission Log
              {log.length > 0 && <span className="ml-2 text-zinc-600">({log.length})</span>}
            </h3>
            {log.length > 0 && (
              <button
                onClick={() => setLog([])}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5 font-mono text-xs">
            {log.length === 0 ? (
              <p className="text-zinc-600 text-center py-6">No readings sent yet.</p>
            ) : (
              [...log].reverse().map((entry, i) => <LogEntry key={i} entry={entry} />)
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600">
          Scan: one unassigned reading every {SCAN_INTERVAL_MS / 1000}s · Trend: {TREND_BATCH_COUNT} readings per batch, {TREND_SPACING_MINUTES} min spacing
        </p>
      </main>
    </div>
  );
}
