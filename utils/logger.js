import winston from 'winston';

const { combine, timestamp, json, printf } = winston.format;

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
export const logEvent = (event, data = {}, level = 'info') => {
  logger.log({
    level,
    event,
    ...data
  });
};
