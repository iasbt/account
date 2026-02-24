import pool from '../db.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting Email Service V2 Migration...');

    // 1. Email Providers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port INTEGER NOT NULL,
        secure BOOLEAN DEFAULT TRUE,
        auth_user VARCHAR(255),
        auth_pass_encrypted TEXT,
        from_name VARCHAR(100),
        from_email VARCHAR(255),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✔ Table email_providers created/verified.');

    // 2. Email Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient VARCHAR(255) NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        status VARCHAR(20) NOT NULL, -- 'queued', 'sending', 'sent', 'failed'
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        provider_id INTEGER REFERENCES email_providers(id),
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✔ Table email_logs created/verified.');

    // 3. Add default provider from env if table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM email_providers');
    if (parseInt(rows[0].count) === 0 && process.env.SMTP_HOST) {
      console.log('Seeding default provider from ENV...');
      await client.query(`
        INSERT INTO email_providers (name, host, port, secure, auth_user, auth_pass_encrypted, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'System Default (Env)',
        process.env.SMTP_HOST,
        process.env.SMTP_PORT || 465,
        true, // Assumption based on typical 465 usage
        process.env.SMTP_USER,
        process.env.SMTP_PASS, // Note: In real app, this should be encrypted. For V2 migration start, we store as is or assume simple encryption later.
        true
      ]);
      console.log('✔ Default provider seeded.');
    }

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('Migration finished.');
  }
};

migrate();
