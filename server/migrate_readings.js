import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const CREATE_READINGS_TABLE = `
CREATE TABLE IF NOT EXISTS readings (
  id            SERIAL PRIMARY KEY,
  patient_id    INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  heart_rate    REAL    NOT NULL,
  spo2          REAL    NOT NULL,
  temperature   REAL    NOT NULL,
  source        VARCHAR(50) DEFAULT 'esp32_simulator',
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_patient_id ON readings(patient_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp  ON readings(timestamp DESC);
`;

async function migrate() {
  try {
    console.log("[migrate_readings] Creating readings table...");
    await pool.query(CREATE_READINGS_TABLE);
    console.log("[migrate_readings] ✓ readings table ready");
    process.exit(0);
  } catch (err) {
    console.error("[migrate_readings] ✗ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
