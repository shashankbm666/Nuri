import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS Configuration ──────────────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGIN || "";
const allowedOrigins = [
  "http://localhost:5173",
  ...rawOrigins.split(",").map(o => o.trim()).filter(Boolean)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable", message: err.message });
  }
});

// ── GET /api/patients  (list all) ────────────────────────────────────────────
// Returns all registered patients — used by the ESP32 Simulator dropdown.
app.get("/api/patients", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, auth0_sub, full_name, email, gender, age, weight_kg, height_cm, created_at FROM patients ORDER BY created_at DESC"
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("[GET /api/patients]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/patients/:sub  (single by auth0_sub) ────────────────────────────
app.get("/api/patients/:sub", async (req, res) => {
  const { sub } = req.params;
  if (!sub) return res.status(400).json({ error: "auth0_sub is required" });
  try {
    const result = await pool.query("SELECT * FROM patients WHERE auth0_sub = $1", [sub]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found", sub });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[GET /api/patients/:sub]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/patients ────────────────────────────────────────────────────────
app.post("/api/patients", async (req, res) => {
  const { auth0_sub, full_name, email, gender, age, weight_kg, height_cm } = req.body;
  if (!auth0_sub || !full_name || !email)
    return res.status(400).json({ error: "auth0_sub, full_name, and email are required" });
  try {
    const result = await pool.query(
      `INSERT INTO patients (auth0_sub, full_name, email, gender, age, weight_kg, height_cm)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [auth0_sub, full_name, email, gender || null, age || null, weight_kg || null, height_cm || null]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "A patient with this Auth0 account already exists. Use PUT to update." });
    console.error("[POST /api/patients]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /api/patients/:sub ────────────────────────────────────────────────────
app.put("/api/patients/:sub", async (req, res) => {
  const { sub } = req.params;
  const { full_name, email, gender, age, weight_kg, height_cm } = req.body;
  if (!full_name || !email)
    return res.status(400).json({ error: "full_name and email are required" });
  try {
    const result = await pool.query(
      `UPDATE patients SET full_name=$1, email=$2, gender=$3, age=$4, weight_kg=$5, height_cm=$6
       WHERE auth0_sub=$7 RETURNING *`,
      [full_name, email, gender || null, age || null, weight_kg || null, height_cm || null, sub]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found — use POST to create first" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[PUT /api/patients/:sub]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/readings ────────────────────────────────────────────────────────
// Accepts a telemetry reading linked to a patient by auth0_sub.
// Validates physiological ranges per clinical safe limits.
// ⚠️  SOURCE: ESP32 Simulator (temporary testing tool) or real ESP32 hardware.
app.post("/api/readings", async (req, res) => {
  const { auth0_sub, heart_rate, spo2, temperature, source } = req.body;

  if (!auth0_sub) return res.status(400).json({ error: "auth0_sub is required" });
  if (heart_rate == null || spo2 == null || temperature == null)
    return res.status(400).json({ error: "heart_rate, spo2, and temperature are required" });

  // Physiological range validation
  const hr = parseFloat(heart_rate);
  const sp = parseFloat(spo2);
  const tp = parseFloat(temperature);
  const errors = [];
  if (isNaN(hr) || hr < 30 || hr > 220) errors.push("heart_rate must be 30–220 bpm");
  if (isNaN(sp) || sp < 50 || sp > 100)  errors.push("spo2 must be 50–100 %");
  if (isNaN(tp) || tp < 30 || tp > 42)   errors.push("temperature must be 30–42 °C");
  if (errors.length) return res.status(400).json({ error: "Physiological range violation", details: errors });

  try {
    // Resolve patient postgres ID from auth0_sub
    const patResult = await pool.query("SELECT id FROM patients WHERE auth0_sub = $1", [auth0_sub]);
    if (patResult.rows.length === 0)
      return res.status(404).json({ error: "Patient not found — register the patient first" });

    const patient_id = patResult.rows[0].id;
    const result = await pool.query(
      `INSERT INTO readings (patient_id, heart_rate, spo2, temperature, source)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, hr, sp, tp, source || "esp32_simulator"]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error("[POST /api/readings]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/patients/:sub/readings ──────────────────────────────────────────
// Fetch all readings for a patient (newest first). Used by Doctor Dashboard.
app.get("/api/patients/:sub/readings", async (req, res) => {
  const { sub } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    const result = await pool.query(
      `SELECT r.id, r.heart_rate, r.spo2, r.temperature, r.source, r.timestamp
       FROM readings r
       JOIN patients p ON r.patient_id = p.id
       WHERE p.auth0_sub = $1
       ORDER BY r.timestamp DESC
       LIMIT $2`,
      [sub, limit]
    );
    res.json({ data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("[GET /api/patients/:sub/readings]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Root ──────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "nuri-backend",
    version: "1.1.0",
    status: "online",
    endpoints: [
      "GET  /api/health",
      "GET  /api/patients                    (list all)",
      "GET  /api/patients/:sub               (by auth0_sub)",
      "POST /api/patients",
      "PUT  /api/patients/:sub",
      "POST /api/readings                    (ESP32 telemetry ingest)",
      "GET  /api/patients/:sub/readings      (reading history)"
    ]
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Nuri Backend] Running on port ${PORT}`);
  console.log(`[Nuri Backend] Allowed origins: ${allowedOrigins.join(", ")}`);
});
