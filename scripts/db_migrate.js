import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    logger.warn({ event: "migrations_dir_missing", path: migrationsDir });
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure order (001, 002, etc.)

  logger.info({ event: "migrations_start", count: files.length });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_at TIMESTAMP DEFAULT NOW()
      );
    `);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      
      // Check if already run
      const check = await client.query('SELECT id FROM _migrations WHERE name = $1', [file]);
      
      if (check.rowCount === 0) {
        logger.info({ event: "running_migration", file });
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      } else {
        // logger.debug({ event: "skipping_migration", file });
      }
    }

    await client.query('COMMIT');
    logger.info({ event: "migrations_complete" });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ event: "migrations_failed", error: err.message });
    process.exit(1);
  } finally {
    client.release();
    // pool.end(); // Don't close pool if called from server.js? 
    // If run as script, we should exit.
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      pool.end();
    }
  }
};

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}

export { runMigrations };
