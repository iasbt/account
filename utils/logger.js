import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'account-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export { logger };

// Helper for structured logging
export const logEvent = (/** @type {string} */ event, /** @type {object} */ data = {}, /** @type {string} */ level = 'info') => {
  logger.log({
    level,
    message: event, // Added required message property
    event,
    ...data
  });
};
