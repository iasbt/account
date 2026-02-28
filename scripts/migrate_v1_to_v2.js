
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BACKUP_DIR = 'D:\\OneDrive\\Desktop\\数据库备份';
const REPORT_FILE = path.join(__dirname, 'migration_secrets_report.txt');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function readCsv(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      // Simple CSV parser - handles basic comma separation
      // Warning: Does not handle commas inside quotes, but backup data seems simple
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : null;
      });
      return row;
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`Warning: Backup file not found: ${filePath}`);
      return [];
    }
    throw err;
  }
}

async function migrateApplications() {
  console.log('Migrating Applications...');
  const apps = await readCsv(path.join(BACKUP_DIR, 'applications_rows.csv'));
  const reportLines = ['=== Application Secrets Report ===', 'Generated at: ' + new Date().toISOString(), ''];

  for (const app of apps) {
    // ETL Transformation
    // V1: code, name, redirect_url
    // V2: app_id, name, allowed_origins[], secret
    
    const appId = app.code;
    const name = app.name;
    // Extract origin from redirect_url
    let origin = '';
    try {
      if (app.redirect_url) {
        const url = new URL(app.redirect_url);
        origin = url.origin;
      }
    } catch (_e) {
      console.warn(`Invalid URL for app ${name}: ${app.redirect_url}`);
    }

    const allowedOrigins = [origin, app.redirect_url].filter(Boolean);
    const secret = crypto.randomBytes(32).toString('hex');
    const isActive = true; // Default to active

    try {
      await pool.query(
        `INSERT INTO public.applications (id, app_id, name, allowed_origins, secret, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (app_id) DO UPDATE SET
           name = EXCLUDED.name,
           allowed_origins = EXCLUDED.allowed_origins,
           updated_at = NOW()
           -- Keep existing secret if conflict to avoid rotating secrets on re-run
         RETURNING id, secret`,
        [app.id || crypto.randomUUID(), appId, name, allowedOrigins, secret, isActive]
      );
      
      console.log(`✅ Migrated App: ${name} (${appId})`);
      reportLines.push(`App: ${name}`);
      reportLines.push(`ID: ${appId}`);
      reportLines.push(`Secret: ${secret}`);
      reportLines.push('-------------------');
    } catch (err) {
      console.error(`❌ Failed to migrate app ${name}:`, err.message);
    }
  }

  await fs.promises.writeFile(REPORT_FILE, reportLines.join('\n'));
  console.log(`Secrets report saved to: ${REPORT_FILE}`);
}

async function migrateUsers() {
  console.log('\nMigrating Users...');
  const users = await readCsv(path.join(BACKUP_DIR, 'users_rows.csv'));

  for (const user of users) {
    // 1. Insert into legacy_users
    try {
        // user.created_at format: 2026-02-03 18:57:51.594625+00
        // Postgres handles this format well
        await pool.query(
            `INSERT INTO public.legacy_users (id, username, email, password_hash, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING`,
            [user.id, user.username, user.email, user.password_hash, user.created_at, user.updated_at]
        );
    } catch (err) {
        console.error(`❌ Failed to archive legacy user ${user.username}:`, err.message);
        continue;
    }

    // 2. Migrate to public.users
    try {
        await pool.query(
            `INSERT INTO public.users (id, name, email, password, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING`,
             // Note: Mapping username -> name, password_hash -> password
             // The ID in legacy is UUID, in V2 users it is text (usually from external provider or same UUID)
             // We keep the UUID as text ID
            [user.id, user.username, user.email, user.password_hash, user.created_at, user.updated_at]
        );
        console.log(`✅ Migrated User: ${user.username}`);
    } catch (err) {
        console.error(`❌ Failed to migrate user ${user.username}:`, err.message);
    }
  }
}

async function main() {
  try {
    console.log('Starting Migration V1 -> V2...');
    
    // Ensure Schema Exists
    const schemaSql = await fs.promises.readFile(path.join(__dirname, 'migrations/001_init_schema_v2.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ Schema initialized/verified.');

    await migrateApplications();
    await migrateUsers();

    console.log('\nMigration Completed Successfully.');
  } catch (e) {
    console.error("Migration Error:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
