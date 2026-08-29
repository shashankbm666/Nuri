import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio, Heart, Activity, Thermometer, Play, Square,
  AlertTriangle, CheckCircle2, Loader2, Wifi, WifiOff, ChevronDown
} from "lucide-react";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ESP32 SIMULATOR — TEMPORARY TESTING TOOL
 *  ⚠️  Remove this entire page once real ESP32 hardware is connected.
 *  It exists only to generate fake telemetry readings to test the
 *  POST /api/readings pipeline and Doctor Dashboard integration.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SCAN_INTERVAL_MS = 8000; // send a reading every 8 seconds

/** Generate a single randomised reading. ~10% chance of an out-of-range value. */
function generateReading() {
  const outOfRange = Math.random() < 0.1; // 10% anomaly chance
  let hr, spo2, temp;

  if (outOfRange) {
    // Pick one vital to push out of normal range
    const pick = Math.floor(Math.random() * 3);
    hr   = pick === 0 ? +(Math.random() * 40 + 110).toFixed(0) : +(Math.random() * 40 + 60).toFixed(0);  // 110-150 vs 60-100
    spo2 = pick === 1 ? +(Math.random() * 8 + 85).toFixed(0)   : +(Math.random() * 5 + 95).toFixed(0);   // 85-93  vs 95-100
    temp = pick === 2 ? +(Math.random() * 2 + 37.8).toFixed(1)  : +(Math.random() * 1.1 + 36.1).toFixed(1); // 37.8-39.8 vs 36.1-37.2
  } else {
    hr   = +(Math.random() * 40 + 60).toFixed(0);
    spo2 = +(Math.random() * 5 + 95).toFixed(0);
    temp = +(Math.random() * 1.1 + 36.1).toFixed(1);
  }

  return { heart_rate: Number(hr), spo2: Number(spo2), temperature: Number(temp) };
}

export default function Esp32Simulator() {
  const [patients, setPatients] = useState([]);
  const [selectedSub, setSelectedSub] = useState("");
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const intervalRef = useRef(null);
  const logEndRef = useRef(null);

  // Scroll log to bottom on new entries
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Fetch patient list on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/patients`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setPatients(json.data || []);
        if (json.data?.length) setSelectedSub(json.data[0].auth0_sub);
      } catch (err) {
        setError(`Failed to load patients: ${err.message}`);
      } finally {
        setLoadingPatients(false);
      }
    })();
  }, []);

  // Send one reading
  const sendReading = useCallback(async () => {
    if (!selectedSub) return;
    const reading = generateReading();
    const ts = new Date().toLocaleTimeString();

    try {
      const res = await fetch(`${BACKEND_URL}/api/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0_sub: selectedSub, ...reading, source: "esp32_simulator" }),
      });

      const json = await res.json();
      if (!res.ok) {
        setLog(prev => [...prev, { ts, status: "error", message: json.error || `HTTP ${res.status}`, ...reading }]);
        return;
      }

      setLog(prev => [...prev, { ts, status: "ok", ...reading }]);
    } catch (err) {
      setLog(prev => [...prev, { ts, status: "error", message: err.message, ...reading }]);
    }
  }, [selectedSub]);

  // Start scanning loop
  const handleStart = useCallback(() => {
    if (!selectedSub) { setError("Select a patient first"); return; }
    setError("");
    setScanning(true);
    sendReading(); // fire immediately
    intervalRef.current = setInterval(sendReading, SCAN_INTERVAL_MS);
  }, [selectedSub, sendReading]);

  // Stop scanning loop
  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const selectedPatient = patients.find(p => p.auth0_sub === selectedSub);

  // Status indicator helpers
  const isAbnormal = (hr, spo2, temp) =>
    hr > 100 || hr < 60 || spo2 < 95 || temp > 37.5 || temp < 36.0;

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

        {/* Connection indicator */}
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
        {/* Patient Selector */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Target Patient
          </label>

          {loadingPatients ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading patients…
            </div>
          ) : patients.length === 0 ? (
            <div className="text-sm text-zinc-400 py-3">
              No registered patients found. Register through the Patient flow first.
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                disabled={scanning}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-700/60 bg-zinc-800/50 text-sm text-left disabled:opacity-50 hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <span>
                  {selectedPatient
                    ? `${selectedPatient.full_name} (${selectedPatient.email})`
                    : "Select a patient…"}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl max-h-56 overflow-y-auto">
                  {patients.map(p => (
                    <button
                      key={p.auth0_sub}
                      onClick={() => { setSelectedSub(p.auth0_sub); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors cursor-pointer ${
                        p.auth0_sub === selectedSub ? "bg-zinc-800 text-white" : "text-zinc-300"
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
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={scanning || !selectedSub}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer
              bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {scanning ? "Scanning…" : "Start Scan"}
          </button>
          <button
            onClick={handleStop}
            disabled={!scanning}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer
              bg-red-600 hover:bg-red-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Live Log */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Transmission Log
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

          <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs">
            {log.length === 0 ? (
              <p className="text-zinc-600 text-center py-6">No readings sent yet. Press Start Scan.</p>
            ) : (
              log.map((entry, i) => {
                const abnormal = entry.heart_rate && isAbnormal(entry.heart_rate, entry.spo2, entry.temperature);
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
                      entry.status === "error"
                        ? "bg-red-500/8 border border-red-500/20"
                        : abnormal
                          ? "bg-amber-500/8 border border-amber-500/20"
                          : "bg-zinc-800/50 border border-zinc-800"
                    }`}
                  >
                    {entry.status === "ok" ? (
                      abnormal
                        ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-zinc-500">{entry.ts}</span>
                      {entry.status === "ok" ? (
                        <span className="ml-2">
                          <span className="text-rose-400">
                            <Heart className="w-3 h-3 inline -mt-0.5" /> {entry.heart_rate}
                          </span>
                          <span className="text-zinc-600 mx-1.5">|</span>
                          <span className="text-cyan-400">
                            <Activity className="w-3 h-3 inline -mt-0.5" /> {entry.spo2}%
                          </span>
                          <span className="text-zinc-600 mx-1.5">|</span>
                          <span className="text-amber-400">
                            <Thermometer className="w-3 h-3 inline -mt-0.5" /> {entry.temperature}°C
                          </span>
                        </span>
                      ) : (
                        <span className="ml-2 text-red-400">{entry.message}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Scan config info */}
        <p className="text-center text-[10px] text-zinc-600">
          Sends one reading every {SCAN_INTERVAL_MS / 1000}s · ~10% chance of anomalous values · Source: esp32_simulator
        </p>
      </main>
    </div>
  );
}
