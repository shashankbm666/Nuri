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
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// ── DELETE /api/patients/:sub ─────────────────────────────────────────────────
app.delete("/api/patients/:sub", async (req, res) => {
  const { sub } = req.params;
  if (!sub) return res.status(400).json({ error: "auth0_sub is required" });
  
  try {
    // Start transaction
    await pool.query("BEGIN");
    
    // First find the patient to get their postgres integer ID (needed for readings)
    const patientRes = await pool.query("SELECT id FROM patients WHERE auth0_sub = $1", [sub]);
    if (patientRes.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Patient not found" });
    }
    
    const patientId = patientRes.rows[0].id;
    
    // Delete readings
    await pool.query("DELETE FROM readings WHERE patient_id = $1", [patientId]);
    
    // Delete patient
    await pool.query("DELETE FROM patients WHERE id = $1", [patientId]);
    
    await pool.query("COMMIT");
    res.json({ success: true, message: "Patient and associated readings deleted successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("[DELETE /api/patients/:sub]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/readings ────────────────────────────────────────────────────────
// Accepts a telemetry reading. If patient_id or auth0_sub is provided, links to patient.
// Otherwise, records as unassigned (patient_id = NULL).
// Optional: timestamp (ISO string) — used by trend batch to space readings historically.
app.post("/api/readings", async (req, res) => {
  const { auth0_sub, patient_id: req_patient_id, heart_rate, spo2, temperature, source, timestamp } = req.body;

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
  if (errors.length) return res.status(422).json({ error: "Physiological range violation", details: errors });

  try {
    let final_patient_id = null;

    if (req_patient_id) {
      final_patient_id = req_patient_id;
    } else if (auth0_sub) {
      const patResult = await pool.query("SELECT id FROM patients WHERE auth0_sub = $1", [auth0_sub]);
      if (patResult.rows.length > 0) {
        final_patient_id = patResult.rows[0].id;
      } else {
        return res.status(404).json({ error: "Patient not found for the given auth0_sub" });
      }
    }

    // If caller provides a timestamp (trend batch), use it; else default to NOW()
    const result = timestamp
      ? await pool.query(
          `INSERT INTO readings (patient_id, heart_rate, spo2, temperature, source, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [final_patient_id, hr, sp, tp, source || "esp32", timestamp]
        )
      : await pool.query(
          `INSERT INTO readings (patient_id, heart_rate, spo2, temperature, source)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [final_patient_id, hr, sp, tp, source || "esp32"]
        );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error("[POST /api/readings]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/readings/batch ──────────────────────────────────────────────────
// Accepts an array of readings and inserts them all in one DB transaction.
// Each reading: { patient_id, heart_rate, spo2, temperature, source, timestamp }
// Used by the ESP32 Simulator "Generate Trend Data" feature.
app.post("/api/readings/batch", async (req, res) => {
  const { readings } = req.body;

  if (!Array.isArray(readings) || readings.length === 0)
    return res.status(400).json({ error: "readings must be a non-empty array" });

  if (readings.length > 100)
    return res.status(400).json({ error: "Maximum 100 readings per batch" });

  // Validate each reading
  const validated = [];
  const validationErrors = [];

  for (let i = 0; i < readings.length; i++) {
    const { patient_id, heart_rate, spo2, temperature, source, timestamp } = readings[i];

    if (heart_rate == null || spo2 == null || temperature == null) {
      validationErrors.push(`readings[${i}]: heart_rate, spo2, and temperature are required`);
      continue;
    }

    const hr = parseFloat(heart_rate);
    const sp = parseFloat(spo2);
    const tp = parseFloat(temperature);

    if (isNaN(hr) || hr < 30 || hr > 220) { validationErrors.push(`readings[${i}]: heart_rate out of range (30-220)`); continue; }
    if (isNaN(sp) || sp < 50 || sp > 100)  { validationErrors.push(`readings[${i}]: spo2 out of range (50-100)`); continue; }
    if (isNaN(tp) || tp < 30 || tp > 42)   { validationErrors.push(`readings[${i}]: temperature out of range (30-42)`); continue; }

    validated.push({ patient_id: patient_id || null, hr, sp, tp, source: source || "esp32", timestamp: timestamp || null });
  }

  if (validationErrors.length > 0)
    return res.status(422).json({ error: "Validation failed", details: validationErrors });

  try {
    await pool.query("BEGIN");
    const inserted = [];
    for (const r of validated) {
      const result = r.timestamp
        ? await pool.query(
            `INSERT INTO readings (patient_id, heart_rate, spo2, temperature, source, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, timestamp`,
            [r.patient_id, r.hr, r.sp, r.tp, r.source, r.timestamp]
          )
        : await pool.query(
            `INSERT INTO readings (patient_id, heart_rate, spo2, temperature, source)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, timestamp`,
            [r.patient_id, r.hr, r.sp, r.tp, r.source]
          );
      inserted.push(result.rows[0]);
    }
    await pool.query("COMMIT");
    res.status(201).json({ inserted: inserted.length, data: inserted });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("[POST /api/readings/batch]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/readings/unassigned ──────────────────────────────────────────────
// Returns all readings where patient_id IS NULL
app.get("/api/readings/unassigned", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, heart_rate, spo2, temperature, source, timestamp
       FROM readings
       WHERE patient_id IS NULL
       ORDER BY timestamp DESC`
    );
    res.json({ data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("[GET /api/readings/unassigned]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/readings/:id/assign ────────────────────────────────────────────
// Assigns an unassigned reading to a patient
app.patch("/api/readings/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { patient_id } = req.body;

  if (!patient_id) return res.status(400).json({ error: "patient_id is required" });

  try {
    const result = await pool.query(
      `UPDATE readings SET patient_id = $1 WHERE id = $2 RETURNING *`,
      [patient_id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Reading not found" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[PATCH /api/readings/:id/assign]", err.message);
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


// ════════════════════════════════════════════════════════════════════════════
// SEAT MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

// Seat preference order by triage priority (inner seats = closer for robot)
const SEAT_PRIORITY = {
  red:    ["R1", "L1", "R2", "L2"],
  orange: ["R1", "L1", "R2", "L2"],
  yellow: ["R2", "L2", "R1", "L1"],
  green:  ["L1", "L2", "R1", "R2"],
  blue:   ["L2", "L1", "R2", "R1"],
};

// ── GET /api/seats ────────────────────────────────────────────────────────────
// Returns all 4 seats with current status and occupant name (if any)
app.get("/api/seats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.status, s.patient_id, s.assigned_at,
             p.full_name AS patient_name
      FROM seats s
      LEFT JOIN patients p ON s.patient_id = p.id
      ORDER BY s.name
    `);
    res.json({ data: result.rows });
  } catch (err) {
    console.error("[GET /api/seats]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/seats/assign ───────────────────────────────────────────────────
// Called after patient completes survey. Assigns the best available seat
// based on triage priority, creates a robot job, and returns the seat + job.
// Body: { auth0_sub, priority: "red"|"orange"|"yellow"|"green"|"blue" }
app.post("/api/seats/assign", async (req, res) => {
  const { auth0_sub, priority } = req.body;
  if (!auth0_sub) return res.status(400).json({ error: "auth0_sub is required" });
  if (!priority)  return res.status(400).json({ error: "priority is required" });

  const preferredOrder = SEAT_PRIORITY[priority] || SEAT_PRIORITY.blue;

  try {
    // Find patient
    const patResult = await pool.query(
      "SELECT id, full_name FROM patients WHERE auth0_sub = $1", [auth0_sub]
    );
    if (patResult.rows.length === 0)
      return res.status(404).json({ error: "Patient not found" });

    const { id: patient_id, full_name: patient_name } = patResult.rows[0];

    // Check if patient already has a seat assigned
    const existing = await pool.query(
      "SELECT * FROM seats WHERE patient_id = $1 AND status = 'occupied'", [patient_id]
    );
    if (existing.rows.length > 0) {
      // Already assigned — return existing seat
      const seat = existing.rows[0];
      const job = await pool.query(
        "SELECT * FROM robot_jobs WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1",
        [patient_id]
      );
      return res.json({
        seat: seat.name,
        seat_id: seat.id,
        job_id: job.rows[0]?.id || null,
        already_assigned: true,
      });
    }

    // Find first available seat in priority order
    await pool.query("BEGIN");
    let assignedSeat = null;
    for (const seatName of preferredOrder) {
      const lockRes = await pool.query(
        `SELECT * FROM seats WHERE name = $1 AND status = 'available' FOR UPDATE SKIP LOCKED`,
        [seatName]
      );
      if (lockRes.rows.length > 0) {
        assignedSeat = lockRes.rows[0];
        break;
      }
    }

    if (!assignedSeat) {
      await pool.query("ROLLBACK");
      return res.status(409).json({ error: "no_seats_available", message: "All seats are currently occupied" });
    }

    // Mark seat occupied
    await pool.query(
      `UPDATE seats SET status = 'occupied', patient_id = $1, assigned_at = NOW()
       WHERE id = $2`,
      [patient_id, assignedSeat.id]
    );

    // Create robot job
    const jobRes = await pool.query(
      `INSERT INTO robot_jobs (patient_id, patient_name, destination, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [patient_id, patient_name, assignedSeat.name]
    );

    await pool.query("COMMIT");
    res.status(201).json({
      seat: assignedSeat.name,
      seat_id: assignedSeat.id,
      job_id: jobRes.rows[0].id,
      patient_name,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("[POST /api/seats/assign]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/seats/:name/release ───────────────────────────────────────────
// Releases a seat when patient is discharged. Called from Doctor Dashboard.
app.patch("/api/seats/:name/release", async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query(
      `UPDATE seats SET status = 'available', patient_id = NULL, assigned_at = NULL
       WHERE name = $1 RETURNING *`,
      [name.toUpperCase()]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Seat not found" });
    res.json({ released: result.rows[0].name, status: "available" });
  } catch (err) {
    console.error("[PATCH /api/seats/:name/release]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/seats/current/:patient_id ───────────────────────────────────────
// ESP32 uses this to confirm which seat a patient is assigned to
app.get("/api/seats/current/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT s.name, s.status, s.assigned_at, rj.id AS job_id, rj.status AS job_status
       FROM seats s
       LEFT JOIN robot_jobs rj ON rj.patient_id = s.patient_id AND rj.status != 'complete'
       WHERE s.patient_id = $1`,
      [patient_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "No seat assigned for this patient" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[GET /api/seats/current/:patient_id]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROBOT JOB QUEUE  (ESP32 polls these)
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/robot/pending ────────────────────────────────────────────────────
// ESP32 polls this every few seconds. Returns the oldest pending job.
// Response: { id, patient_name, destination, created_at }
app.get("/api/robot/pending", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, patient_name, destination, created_at
       FROM robot_jobs
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1`
    );
    if (result.rows.length === 0)
      return res.json({ job: null });
    res.json({ job: result.rows[0] });
  } catch (err) {
    console.error("[GET /api/robot/pending]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/robot/jobs/:id/start ──────────────────────────────────────────
// ESP32 calls this when it starts moving toward the destination.
// Changes job status: pending → in_progress
app.patch("/api/robot/jobs/:id/start", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE robot_jobs SET status = 'in_progress', started_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING *`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Job not found or already started" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("[PATCH /api/robot/jobs/:id/start]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/robot/jobs/:id/complete ─────────────────────────────────────────
// ESP32 calls this after collecting vitals.
// Body: { heart_rate, spo2, temperature }
// Inserts a reading for the patient, marks job complete.
// ESP32 sends: { "user": "Rahul", "destination": "L1", "heartRate": 75, "spo2": 98,
//               "temperature": 36.5, "status": "complete" }
app.post("/api/robot/jobs/:id/complete", async (req, res) => {
  const { id } = req.params;
  // Accept both camelCase (ESP32 native) and snake_case
  const heart_rate = req.body.heart_rate ?? req.body.heartRate;
  const spo2       = req.body.spo2;
  const temperature = req.body.temperature;

  if (heart_rate == null || spo2 == null || temperature == null)
    return res.status(400).json({ error: "heart_rate, spo2, and temperature are required" });

  const hr = parseFloat(heart_rate);
  const sp = parseFloat(spo2);
  const tp = parseFloat(temperature);

  const errors = [];
  if (isNaN(hr) || hr < 30 || hr > 220) errors.push("heart_rate out of range (30-220)");
  if (isNaN(sp) || sp < 50 || sp > 100)  errors.push("spo2 out of range (50-100)");
  if (isNaN(tp) || tp < 30 || tp > 42)   errors.push("temperature out of range (30-42)");
  if (errors.length) return res.status(422).json({ error: "Range violation", details: errors });

  try {
    // Get job to find patient_id
    const jobRes = await pool.query(
      "SELECT * FROM robot_jobs WHERE id = $1", [id]
    );
    if (jobRes.rows.length === 0)
      return res.status(404).json({ error: "Job not found" });
    const job = jobRes.rows[0];

    await pool.query("BEGIN");

    // Insert reading linked to patient
    const readingRes = await pool.query(
      `INSERT INTO readings (patient_id, heart_rate, spo2, temperature, source)
       VALUES ($1, $2, $3, $4, 'nuri_robot') RETURNING *`,
      [job.patient_id, hr, sp, tp]
    );

    // Mark job complete
    await pool.query(
      `UPDATE robot_jobs SET status = 'complete', completed_at = NOW() WHERE id = $1`,
      [id]
    );

    await pool.query("COMMIT");
    res.status(201).json({
      message: "Vitals recorded and job complete",
      reading: readingRes.rows[0],
      job_id: id,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("[POST /api/robot/jobs/:id/complete]", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Root ──────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "nuri-backend",
    version: "1.2.0",
    status: "online",
    endpoints: [
      "GET  /api/health",
      "GET  /api/patients                       (list all)",
      "GET  /api/patients/:sub                  (by auth0_sub)",
      "POST /api/patients",
      "PUT  /api/patients/:sub",
      "DELETE /api/patients/:sub",
      "POST /api/readings                       (single reading)",
      "POST /api/readings/batch                 (batch readings)",
      "GET  /api/readings/unassigned",
      "PATCH /api/readings/:id/assign",
      "GET  /api/patients/:sub/readings",
      "GET  /api/seats                          (seat map)",
      "POST /api/seats/assign                   (assign seat by triage priority)",
      "PATCH /api/seats/:name/release           (release seat on discharge)",
      "GET  /api/seats/current/:patient_id      (ESP32: which seat for patient?)",
      "GET  /api/robot/pending                  (ESP32: next job to execute)",
      "PATCH /api/robot/jobs/:id/start          (ESP32: mark job in-progress)",
      "POST /api/robot/jobs/:id/complete        (ESP32: submit vitals + complete)",
    ]
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Nuri Backend] Running on port ${PORT}`);
  console.log(`[Nuri Backend] Allowed origins: ${allowedOrigins.join(", ")}`);
});
