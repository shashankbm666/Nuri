/**
 * Nuri Database Migration Script
 *
 * Run once to set up the schema on a fresh PostgreSQL database:
 *   node server/migrate.js
 *
 * Safe to re-run — uses IF NOT EXISTS to avoid duplicate errors.
 */

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Add it to your .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS patients (
  id          SERIAL PRIMARY KEY,
  auth0_sub   TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  gender      TEXT,
  age         INTEGER,
  weight_kg   NUMERIC,
  height_cm   NUMERIC,
  created_at  TIMESTAMP DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("[migrate] Connected to PostgreSQL.");
    await client.query(SCHEMA_SQL);
    console.log("[migrate] ✓ patients table created (or already exists).");
    console.log("[migrate] Migration complete.");
  } catch (err) {
    console.error("[migrate] ERROR:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
