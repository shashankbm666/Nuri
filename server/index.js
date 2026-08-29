import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

// Load .env for local development. Render sets env vars via its dashboard.
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS Configuration ──────────────────────────────────────────────────────
// Reads allowed origin(s) from ALLOWED_ORIGIN env var (comma-separated).
// Always includes http://localhost:5173 for local frontend dev.
const rawOrigins = process.env.ALLOWED_ORIGIN || "";
const allowedOrigins = [
  "http://localhost:5173",
  ...rawOrigins.split(",").map(o => o.trim()).filter(Boolean)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable", message: err.message });
  }
});

// ── GET /api/patients/:sub ────────────────────────────────────────────────────
// Look up a patient by Auth0 sub. Returns 200 + record, or 404 if new user.
app.get("/api/patients/:sub", async (req, res) => {
  const { sub } = req.params;
  if (!sub) return res.status(400).json({ error: "auth0_sub is required" });

  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE auth0_sub = $1",
      [sub]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found", sub });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[GET /api/patients/:sub]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/patients ────────────────────────────────────────────────────────
// Create a new patient. Rejects duplicate auth0_sub with 409.
app.post("/api/patients", async (req, res) => {
  const { auth0_sub, full_name, email, gender, age, weight_kg, height_cm } = req.body;

  if (!auth0_sub || !full_name || !email) {
    return res.status(400).json({ error: "auth0_sub, full_name, and email are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO patients (auth0_sub, full_name, email, gender, age, weight_kg, height_cm)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [auth0_sub, full_name, email, gender || null, age || null, weight_kg || null, height_cm || null]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      // PostgreSQL unique_violation — auth0_sub already exists
      return res.status(409).json({ error: "A patient with this Auth0 account already exists. Use PUT to update." });
    }
    console.error("[POST /api/patients]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /api/patients/:sub ────────────────────────────────────────────────────
// Update an existing patient's profile details.
app.put("/api/patients/:sub", async (req, res) => {
  const { sub } = req.params;
  const { full_name, email, gender, age, weight_kg, height_cm } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: "full_name and email are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE patients
       SET full_name = $1, email = $2, gender = $3, age = $4, weight_kg = $5, height_cm = $6
       WHERE auth0_sub = $7
       RETURNING *`,
      [full_name, email, gender || null, age || null, weight_kg || null, height_cm || null, sub]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found — use POST to create first" });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[PUT /api/patients/:sub]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "nuri-backend",
    version: "1.0.0",
    status: "online",
    endpoints: [
      "GET  /api/health",
      "GET  /api/patients/:sub",
      "POST /api/patients",
      "PUT  /api/patients/:sub"
    ]
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Nuri Backend] Running on port ${PORT}`);
  console.log(`[Nuri Backend] Allowed origins: ${allowedOrigins.join(", ")}`);
});
