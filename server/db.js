import pg from "pg";
import dotenv from "dotenv";

// Load .env for local development. On Render, env vars are set via dashboard.
dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("[Nuri DB] ERROR: DATABASE_URL is not set. Check your .env or Render environment variables.");
  process.exit(1);
}

/**
 * PostgreSQL connection pool
 * - Uses DATABASE_URL from environment (never hardcoded)
 * - SSL with rejectUnauthorized: false is required for Render's managed Postgres
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's managed PostgreSQL
  }
});

pool.on("error", (err) => {
  console.error("[Nuri DB] Unexpected pool error:", err.message);
});

export default pool;
