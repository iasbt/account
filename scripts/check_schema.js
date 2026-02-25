import pool from '../db.js';

async function run() {
  try {
    console.log('Checking applications table schema...');
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications';
    `);
    console.log('Columns:', res.rows);

    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'public.applications'::regclass;
    `);
    console.log('Constraints:', constraints.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
