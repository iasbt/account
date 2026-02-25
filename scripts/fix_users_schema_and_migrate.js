
import pool from '../db.js';

const run = async () => {
  try {
    console.log("Fixing users schema and migrating data...");

    // 1. Drop existing users table (since it's empty/wrong)
    await pool.query("DROP TABLE IF EXISTS public.users CASCADE");
    console.log("Dropped users table.");

    // 2. Create users table with correct schema (using TEXT for ID to support legacy UUIDs)
    await pool.query(`
      CREATE TABLE public.users (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Created users table with correct schema.");

    // 3. Migrate data from legacy_users
    const legacyUsers = await pool.query("SELECT * FROM public.legacy_users");
    
    for (const user of legacyUsers.rows) {
      // legacy_users: id, username, email, password_hash, is_admin, created_at
      // users: name, email, password, is_admin, created_at
      
      await pool.query(`
        INSERT INTO public.users (id, name, email, password, is_admin, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, [user.id, user.username, user.email, user.password_hash, user.is_admin || false, user.created_at]);
      
      console.log(`Migrated user: ${user.username}`);
    }

    // 4. Update sequence (Skipped since ID is TEXT)
    // await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM public.users))`);
    
    console.log("Migration complete.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
};

run();
