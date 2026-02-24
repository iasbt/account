
import pool from '../db.js';

const run = async () => {
  try {
    const res = await pool.query('SELECT name, app_id FROM applications');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

run();
