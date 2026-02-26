
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  try {
    const appId = 'gallery';
    const primaryOrigin = 'http://119.91.71.30:5173';
    const callbackOrigin = 'http://119.91.71.30:5173/auth/callback';
    
    console.log(`Checking allowed_origins for app: ${appId}...`);

    const res = await pool.query('SELECT allowed_origins FROM applications WHERE app_id = $1', [appId]);
    
    if (res.rowCount === 0) {
      console.error('❌ Gallery app not found in database!');
      return;
    }
    
    let currentOrigins = res.rows[0].allowed_origins || [];
    console.log(`Current origins: ${JSON.stringify(currentOrigins)}`);

    // Ensure primaryOrigin exists
    if (!currentOrigins.includes(primaryOrigin)) {
      currentOrigins.push(primaryOrigin);
    }
    // Ensure callbackOrigin exists
    if (!currentOrigins.includes(callbackOrigin)) {
      currentOrigins.push(callbackOrigin);
    }

    // Reorder: Move primaryOrigin to the front, then callbackOrigin
    const newOrigins = [
      primaryOrigin,
      callbackOrigin,
      ...currentOrigins.filter(o => o !== primaryOrigin && o !== callbackOrigin)
    ];

    if (JSON.stringify(newOrigins) !== JSON.stringify(currentOrigins)) {
      await pool.query('UPDATE applications SET allowed_origins = $1, updated_at = NOW() WHERE app_id = $2', [newOrigins, appId]);
      console.log(`✅ Updated Gallery allowed_origins to: ${JSON.stringify(newOrigins)}`);
    } else {
      console.log(`✅ Gallery origins already up to date.`);
    }

  } catch (err) {
    console.error('❌ Error updating database:', err);
  } finally {
    await pool.end();
  }
}

main();
