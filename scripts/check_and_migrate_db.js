
import pool from '../db.js';

const run = async () => {
  try {
    console.log("Checking database tables...");

    // Check legacy_users
    const legacyRes = await pool.query("SELECT count(*) FROM public.legacy_users");
    const legacyCount = parseInt(legacyRes.rows[0].count);
    console.log(`Legacy users count: ${legacyCount}`);

    // Check users
    const usersRes = await pool.query("SELECT count(*) FROM public.users");
    const usersCount = parseInt(usersRes.rows[0].count);
    console.log(`New users count: ${usersCount}`);

    if (legacyCount > 0 && usersCount === 0) {
      console.log("Migration needed: legacy_users -> users");
      console.log("Starting migration...");
      
      const legacyUsers = await pool.query("SELECT * FROM public.legacy_users");
      
      for (const user of legacyUsers.rows) {
        // legacy_users: id, username, email, password_hash, created_at, is_admin
        // users: id, name, email, password, is_admin, created_at, updated_at, avatar_url
        
        // Note: We might need to handle ID conflict if we want to preserve IDs, 
        // but users.id is BIGSERIAL and legacy_users.id is SERIAL (integer).
        // Let's try to preserve ID if possible, or just let new ID be generated.
        // Given 'legacy', preservation is better for references.
        
        await pool.query(`
          INSERT INTO public.users (id, name, email, password, is_admin, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (email) DO NOTHING
        `, [user.id, user.username, user.email, user.password_hash, user.is_admin || false, user.created_at]);
        
        console.log(`Migrated user: ${user.username}`);
      }
      
      // Update sequence
      await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM public.users))`);
      console.log("Migration complete.");
    } else {
      console.log("No migration needed (users table already populated or legacy empty).");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
};

run();
