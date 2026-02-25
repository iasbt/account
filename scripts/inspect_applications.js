import pool from '../db.js';

async function run() {
  try {
    console.log('Fetching applications...');
    const res = await pool.query('SELECT * FROM public.applications');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
