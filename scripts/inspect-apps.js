import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST === 'iasbt-postgres' ? 'localhost' : process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
});

async function inspect() {
  try {
    // Get schema
    const schema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'applications'
    `);
    console.log('Schema:', schema.rows);

    // Get data
    const data = await pool.query('SELECT * FROM applications');
    console.log('Data count:', data.rowCount);
    console.log('Data:', data.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspect();
