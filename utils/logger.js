import winston from 'winston';

const { combine, timestamp, json } = winston.format;

// Create Winston logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json() // Log in JSON format for easier parsing by aggregation tools
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Helper for structured logging
export const logEvent = (/** @type {string} */ event, /** @type {object} */ data = {}, /** @type {string} */ level = 'info') => {
  logger.log({
    level,
    message: event, // Added required message property
    event,
    ...data
  });
};
