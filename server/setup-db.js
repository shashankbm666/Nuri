/**
 * DB Migration: Create seats + robot_jobs tables
 * Run once: node server/setup-db.js
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running DB migration...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(5)  NOT NULL UNIQUE,
      status       VARCHAR(20) NOT NULL DEFAULT 'available',
      patient_id   INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      assigned_at  TIMESTAMPTZ
    );
  `);
  console.log('✓ seats table');

  // Seed the 4 physical seats if not present
  for (const name of ['R1', 'R2', 'L1', 'L2']) {
    await pool.query(
      `INSERT INTO seats (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
  console.log('✓ seats seeded (R1, R2, L1, L2)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS robot_jobs (
      id           SERIAL PRIMARY KEY,
      patient_id   INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      patient_name VARCHAR(255),
      destination  VARCHAR(5)  NOT NULL,
      status       VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at   TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
  `);
  console.log('✓ robot_jobs table');

  console.log('\n✅ Migration complete');
  await pool.end();
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
