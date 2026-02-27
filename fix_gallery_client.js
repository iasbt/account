import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://root:djNV78.vAswB7VT@119.91.71.30:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const query = `
      INSERT INTO public.applications (app_id, name, secret, allowed_origins, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (app_id) 
      DO UPDATE SET allowed_origins = $4, updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      'gallery-client',
      'Gallery App',
      'gallery_secret_placeholder',
      ['http://localhost:5173/auth/callback', 'http://127.0.0.1:5173/auth/callback', 'http://119.91.71.30:5173/auth/callback'],
      true
    ];

    const res = await client.query(query, values);
    console.log('Successfully upserted gallery-client:', res.rows[0]);

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
