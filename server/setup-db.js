/**
 * Full DB Migration — Supabase
 * Creates ALL tables from scratch.
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
  console.log('Connecting to Supabase...');
  await pool.query('SELECT 1'); // connection check
  console.log('✓ Connected\n');

  // ── patients ────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id          SERIAL PRIMARY KEY,
      auth0_sub   VARCHAR(255) UNIQUE NOT NULL,
      full_name   VARCHAR(255),
      email       VARCHAR(255),
      gender      VARCHAR(50),
      age         INTEGER,
      weight_kg   DECIMAL(5,2),
      height_cm   DECIMAL(5,2),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✓ patients table');

  // ── readings ────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS readings (
      id          SERIAL PRIMARY KEY,
      patient_id  INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      heart_rate  DECIMAL(6,2),
      spo2        DECIMAL(5,2),
      temperature DECIMAL(5,2),
      source      VARCHAR(50) DEFAULT 'manual',
      timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✓ readings table');

  // ── seats ───────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(5)  NOT NULL UNIQUE,
      status       VARCHAR(20) NOT NULL DEFAULT 'available',
      patient_id   INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      assigned_at  TIMESTAMPTZ
    );
  `);
  // Seed the 4 physical seats
  for (const name of ['R1', 'R2', 'L1', 'L2']) {
    await pool.query(
      `INSERT INTO seats (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
  console.log('✓ seats table + seeded R1 R2 L1 L2');

  // ── robot_jobs ──────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS robot_jobs (
      id           SERIAL PRIMARY KEY,
      patient_id   INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      patient_name VARCHAR(255),
      destination  VARCHAR(5)  NOT NULL,
      status       VARCHAR(20) NOT NULL DEFAULT 'pending',
      priority     VARCHAR(10) NOT NULL DEFAULT 'blue',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at   TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
  `);
  console.log('✓ robot_jobs table');

  // ── verify ──────────────────────────────────────────────────────────────────
  const tables = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log('\n📋 Tables in public schema:');
  tables.rows.forEach(r => console.log('   •', r.tablename));

  const seatRows = await pool.query('SELECT name, status FROM seats ORDER BY name');
  console.log('\n🪑 Seats:');
  seatRows.rows.forEach(r => console.log(`   ${r.name} — ${r.status}`));

  console.log('\n✅ Migration complete — Supabase is ready');
  await pool.end();
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
