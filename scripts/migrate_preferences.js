import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migratePreferences = async () => {
  const sqlPath = path.join(__dirname, 'migrations', '004_add_user_preferences.sql');
  
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running User Preferences migration...');
    await pool.query(sql);
    console.log('User Preferences migration successful.');
  } catch (err) {
    console.error('User Preferences migration failed:', err);
    // Don't throw, just log. We don't want to stop the server if this fails (or maybe we do?)
    // If table missing, apps will fail. But maybe we want to proceed.
    // Let's propagate error? No, initEmailTemplates catches and logs.
  }
};

