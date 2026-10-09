import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Try multiple Supabase connection formats
const variants = [
  // New session pooler (port 5432) — preferred
  `postgresql://postgres.hnndwdrdrovepqqrcxnq:Sha576sha213@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  // Transaction pooler (port 6543)
  `postgresql://postgres.hnndwdrdrovepqqrcxnq:Sha576sha213@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  // US East pooler (in case region is us-east)
  `postgresql://postgres.hnndwdrdrovepqqrcxnq:Sha576sha213@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  // EU West pooler
  `postgresql://postgres.hnndwdrdrovepqqrcxnq:Sha576sha213@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
  // Old direct format (just in case DNS is slow)
  `postgresql://postgres:Sha576sha213@db.hnndwdrdrovepqqrcxnq.supabase.co:5432/postgres`,
];

for (const url of variants) {
  const label = url.match(/(@.+?)\//)?.[1] || url;
  try {
    const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    await pool.query('SELECT 1');
    console.log(`✅ WORKS: ${label}`);
    console.log(`\nFull working URL:\n${url}`);
    await pool.end();
    break;
  } catch(e) {
    console.log(`❌ FAIL:  ${label} — ${e.message}`);
  }
}
