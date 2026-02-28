import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import pool from '../config/db.js';

// Redis connection for worker
import Redis from 'ioredis';
const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

/**
 * Get active email provider configuration
 * Prioritizes active DB provider, falls back to ENV config
 */
const getProviderConfig = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM email_providers WHERE is_active = true LIMIT 1'
    );
    
    if (rows.length > 0) {
      const provider = rows[0];
      return {
        id: provider.id,
        host: provider.host,
        port: provider.port,
        secure: provider.secure,
        auth: {
          user: provider.auth_user,
          pass: provider.auth_pass_encrypted, // Decrypt if encrypted in future
        },
        from: provider.from_email 
          ? `"${provider.from_name || 'System'}" <${provider.from_email}>`
          : `"${config.smtp.user}" <${config.smtp.user}>`
      };
    }
  } catch (err) {
    console.error('Failed to fetch provider config, falling back to ENV', err);
  }

  // Fallback to ENV
  return {
    id: null,
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    from: `"IASBT Account" <${config.smtp.user}>`
  };
};

// Create Worker
export const emailWorker = new Worker('email-queue', async (job) => {
  const { to, subject, html, type } = job.data;
  // const logId = job.id; // Or generate UUID if we want DB ID match

  console.log(`[EmailWorker] Processing job ${job.id}: ${type} -> ${to}`);

  let providerId = null;

  try {
    // 1. Get Config
    const providerConfig = await getProviderConfig();
    providerId = providerConfig.id;

    // 2. Log Start (Optional, usually we log result)
    // await logEmailStatus(to, type, subject, 'sending', null, providerId);

    // 3. Create Transporter
    const transporter = nodemailer.createTransport({
      host: providerConfig.host,
      port: providerConfig.port,
      secure: providerConfig.secure,
      auth: providerConfig.auth,
    });

    // 4. Send Email
    const info = await transporter.sendMail({
      from: providerConfig.from,
      to,
      subject,
      html,
    });

    console.log(`[EmailWorker] Sent: ${info.messageId}`);

    // 5. Log Success
    await logEmailStatus(to, type, subject, 'sent', null, providerId, info.messageId);
    
    return info;

  } catch (err) {
    console.error(`[EmailWorker] Failed job ${job.id}:`, err);
    
    // 6. Log Failure
    await logEmailStatus(to, type, subject, 'failed', err.message, providerId);
    
    throw err; // Trigger BullMQ retry
  }
}, { 
  connection,
  concurrency: 5 // Process 5 emails at once
});

// Helper: Log to DB
async function logEmailStatus(recipient, type, subject, status, error, providerId, _messageId = null) {
  try {
    await pool.query(
      `INSERT INTO email_logs (
        recipient, template_type, subject, status, error_message, provider_id, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        recipient, 
        type, 
        subject, 
        status, 
        error ? error.substring(0, 1000) : null, // Truncate error
        providerId,
        status === 'sent' ? new Date() : null
      ]
    );
  } catch (dbErr) {
    console.error('[EmailWorker] Failed to write log:', dbErr);
  }
}

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`[EmailWorker] Job ${job.id} failed with ${err.message}`);
});
