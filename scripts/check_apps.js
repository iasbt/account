import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkApps() {
  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query('SELECT * FROM apps');
    console.log('Apps found:', res.rows.length);
    res.rows.forEach(app => {
      console.log(`- App: ${app.name} (ID: ${app.app_id})`);
      console.log(`  Redirect URIs: ${JSON.stringify(app.allowed_origins)}`);
      console.log(`  Secret: ${app.secret ? 'Set' : 'Null'}`);
    });

    // Check if gallery-client exists
    const gallery = res.rows.find(app => app.app_id === 'gallery-client');
    if (!gallery) {
      console.log('\n[WARN] gallery-client not found!');
    } else {
        // Check if redirect URIs include the gallery URL
        const origins = gallery.allowed_origins || [];
        const required = ['http://119.91.71.30:5173', 'http://localhost:5173'];
        const missing = required.filter(r => !origins.includes(r));
        
        if (missing.length > 0) {
            console.log(`\n[WARN] Missing redirect URIs: ${missing.join(', ')}`);
        } else {
            console.log('\n[OK] gallery-client configuration looks correct.');
        }
    }

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

checkApps();
