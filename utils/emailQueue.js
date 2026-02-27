import { Queue } from 'bullmq';
import { config } from '../config/index.js';
import Redis from 'ioredis';

// Create a redis instance but don't panic if it fails
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 2000, 60000),
};

const connection = new Redis(redisConfig);

connection.on('error', (err) => {
  // Suppress ECONNREFUSED logs
  if (err.code === 'ECONNREFUSED') return;
  console.error('Redis Queue Error:', err.message);
});

export const emailQueue = new Queue('email-queue', { connection });

/**
 * Add an email job to the queue
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string} type - Template type (for logging)
 * @param {object} options - BullMQ job options
 */
export const addEmailJob = async (to, subject, html, type = 'general', options = {}) => {
  // Check if redis is ready
  if (connection.status !== 'ready') {
    console.warn(`[Email Skipped] Redis not ready. Subject: ${subject}`);
    return null;
  }
  
  try {
    return await emailQueue.add('send-email', {
      to,
      subject,
      html,
      type
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for inspection
      ...options
    });
  } catch (error) {
    console.error('Failed to add email job:', error.message);
    return null;
  }
};
