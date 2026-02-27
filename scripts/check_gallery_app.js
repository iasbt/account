import pool from '../db.js';

async function run() {
  try {
    const res = await pool.query("SELECT * FROM applications WHERE app_id = 'gallery'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
