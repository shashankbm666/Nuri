import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgresql://nuri_db_user:q8NELZqzEJyoojhLFmZB5y4huBQuIN9l@dpg-da9lh4p42hec7388t740-a.oregon-postgres.render.com/nuri_db',
  ssl: { rejectUnauthorized: false }
});

const BACKEND = 'https://nuribackend.onrender.com';

async function waitForDeploy(maxAttempts = 20) {
  console.log('Waiting for Render deploy...');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND}/api/health`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok') { console.log('Backend up:', json.timestamp); return true; }
      }
    } catch {}
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

async function test() {
  const up = await waitForDeploy();
  if (!up) { console.error('Backend did not come up'); pool.end(); return; }

  // Check CORS headers for PATCH
  console.log('\n--- 1. CORS preflight for PATCH ---');
  const preflight = await fetch(`${BACKEND}/api/readings/1/assign`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://nuri001.vercel.app',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });
  const methods = preflight.headers.get('access-control-allow-methods');
  console.log('Allow-Methods:', methods);
  console.log('PATCH allowed:', methods?.includes('PATCH') ? 'YES ✅' : 'NO ❌');

  // Build and send batch
  const now = Date.now();
  const readings = Array.from({ length: 12 }, (_, i) => ({
    patient_id: 1,
    heart_rate: i === 9 ? 118 : 70 + Math.round(Math.random() * 18),
    spo2: i === 3 ? 89 : 96 + Math.round(Math.random() * 3),
    temperature: +(36.3 + Math.random() * 0.6).toFixed(1),
    source: 'verify_batch',
    timestamp: new Date(now - (11 - i) * 4 * 60 * 1000).toISOString(),
  }));

  console.log('\n--- 2. POST /api/readings/batch ---');
  const t0 = Date.now();
  const res = await fetch(`${BACKEND}/api/readings/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readings }),
  });
  const elapsed = Date.now() - t0;
  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Time:', elapsed + 'ms for', readings.length, 'readings');
  console.log('Inserted:', json.inserted);

  // Verify in DB
  console.log('\n--- 3. DB verification ---');
  const dbRes = await pool.query(
    `SELECT id, heart_rate, spo2, temperature, timestamp
     FROM readings WHERE source = 'verify_batch'
     ORDER BY timestamp ASC`
  );
  console.log('Rows in DB:', dbRes.rows.length, '(expected 12)');
  console.log('Earliest:', dbRes.rows[0]?.timestamp);
  console.log('Latest:', dbRes.rows[dbRes.rows.length-1]?.timestamp);
  const anomalies = dbRes.rows.filter(r => r.heart_rate > 100 || r.spo2 < 95);
  console.log('Anomalous readings in batch:', anomalies.length, '(expected 2)');
  console.log('\nResult:', dbRes.rows.length === 12 && json.inserted === 12 ? '✅ ALL GOOD' : '❌ MISMATCH');

  await pool.end();
}

test().catch(console.error);
