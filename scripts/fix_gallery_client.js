import pool from '../db.js';

const run = async () => {
  try {
    console.log('🔌 Connecting to database...');
    
    const client = await pool.connect();
    console.log('✅ Connected.');

    const appId = 'gallery-client';
    const appName = 'Gallery App';
    const appSecret = 'gallery_secret_123'; // Must match Gallery's VITE_CLIENT_SECRET or similar if used (though public clients don't use secret, confidential ones do. Gallery seems to be treated as confidential in some contexts, but SPA usually public. However, strict mode might require secret for code exchange if enforced. Let's set a secret anyway.)
    // Actually, for PKCE with public client, secret is not needed, but my backend might enforce it if configured as confidential. 
    // The previous summary mentioned "Client: Confidential clients (like Gallery) must provide client_secret." in memory id="01KJDWPMWCW7MWH4A0SMHX0S6X".
    // So I MUST set a secret.
    
    const allowedOrigins = [
      'http://localhost:5173/auth/callback',
      'http://127.0.0.1:5173/auth/callback',
      'http://119.91.71.30:5173/auth/callback',
      'https://gallery.iasbt.com/auth/callback' // Speculative, but harmless
    ];

    console.log(`🛠️ Upserting app: ${appId}`);
    console.log(`   Origins: ${allowedOrigins.join(', ')}`);

    const query = `
      INSERT INTO public.applications (app_id, name, secret, allowed_origins, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (app_id) 
      DO UPDATE SET 
        allowed_origins = $4, 
        secret = $3,
        updated_at = NOW()
      RETURNING *;
    `;

    const res = await client.query(query, [appId, appName, appSecret, allowedOrigins, true]);
    
    console.log('🎉 Successfully upserted gallery-client:');
    console.log(JSON.stringify(res.rows[0], null, 2));

    client.release();
  } catch (err) {
    console.error('❌ Error executing query:', err);
  } finally {
    await pool.end();
  }
};

run();
