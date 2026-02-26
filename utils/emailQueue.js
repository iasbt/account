import { Queue } from 'bullmq';
import { config } from '../config/index.js';
import Redis from 'ioredis';

// Reuse the Redis connection from config
// Note: BullMQ requires a Redis connection. 
// We use ioredis as recommended by BullMQ.

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    // If we can't connect, don't spam.
    // Return null to stop retrying? No, BullMQ needs retry.
    // But we can backoff aggressively.
    return Math.min(times * 2000, 60000); 
  },
  // Suppress connection errors in dev
  reconnectOnError: (err) => {
    return false;
  }
});

connection.on('error', (err) => {
  // Suppress ECONNREFUSED logs in console to avoid flooding
  if (err.code === 'ECONNREFUSED') return;
  console.error('Redis Queue Error:', err);
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
  return emailQueue.add('send-email', {
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
};
