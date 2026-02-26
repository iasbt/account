
import pool from '../db.js';
import { APPLICATIONS } from '../config/apps.js';

const run = async () => {
  try {
    console.log("Initializing Applications Table...");

    // 0. Drop Table if exists (RESET for V1.8.0)
    await pool.query("DROP TABLE IF EXISTS public.applications");
    console.log("Dropped existing 'applications' table.");

    // 1. Create Table
    await pool.query(`
      CREATE TABLE public.applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        allowed_origins TEXT[] NOT NULL,
        secret VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Table 'applications' created.");

    console.log("Keys to process:", Object.keys(APPLICATIONS));

    // 2. Seed Data from config/apps.js
    for (const key of Object.keys(APPLICATIONS)) {
      const app = APPLICATIONS[key];
      console.log(`Processing app: ${key}, ID: ${app.id}, Name: ${app.name}`);
      console.log(`Secret for ${key}:`, app.secret ? "***" : "UNDEFINED");
      
      try {
        await pool.query(
          `INSERT INTO public.applications (app_id, name, allowed_origins, secret)
           VALUES ($1, $2, $3, $4)`,
          [
            app.id,
            app.name,
            app.allowedOrigins,
            app.secret || "default_secret" // Fallback to avoid crash
          ]
        );
        console.log(`Seeded app: ${app.name}`);
      } catch (insertErr) {
        console.error(`Failed to seed app ${app.name}:`, insertErr);
      }
    }

    console.log("Initialization complete.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
