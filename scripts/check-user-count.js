import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST === 'iasbt-postgres' ? 'localhost' : process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
});

console.log('Connecting to DB Host:', pool.options.host);

async function check() {
  try {
    // Try legacy_users first as per adminController
    console.log('Checking legacy_users table...');
    const res = await pool.query('SELECT count(*) FROM legacy_users');
    console.log('User count:', res.rows[0].count);
    
    // Also check if there are other tables like "users"
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in public schema:', tables.rows.map(r => r.table_name).join(', '));
    
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('Hint: Ensure you have port-forwarded the remote DB to localhost:5432 or use the correct host.');
    }
  } finally {
    await pool.end();
  }
}

check();
