import pool from '../db.js';

async function run() {
  try {
    console.log('Adding version column to applications table...');
    await pool.query(`
      ALTER TABLE public.applications 
      ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT '1.0.0';
    `);
    console.log('Column added successfully.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

run();
