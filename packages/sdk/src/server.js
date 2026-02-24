import express from 'express';

/**
 * @typedef {Object} MicroAppConfig
 * @property {string} name - Application name
 * @property {string} version - Application version
 * @property {express.Router} router - Express router instance
 */

/**
 * Register a micro-app and return the configured router.
 * Automatically adds /health and /metrics endpoints.
 * 
 * @param {MicroAppConfig} config 
 * @returns {express.Router}
 */
export function registerMicroApp(config) {
  console.log(`[SDK] Registering micro-app: ${config.name} v${config.version}`);
  
  const wrapperRouter = express.Router();

  // Standard Health Check
  wrapperRouter.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      name: config.name,
      version: config.version,
      timestamp: Date.now(),
      traceId: req.headers['x-request-id'] || 'unknown'
    });
  });

  // Standard Metrics (Placeholder)
  wrapperRouter.get('/metrics', (req, res) => {
    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  // Mount the actual app router
  wrapperRouter.use('/', config.router);

  return wrapperRouter;
}

/**
 * Extract standard app context from request.
 * Assumes auth middleware has already populated req.user
 * 
 * @param {express.Request} req 
 * @returns {Object}
 */
export function getAppContext(req) {
  return {
    user: req.user || null,
    traceId: req.headers['x-request-id'] || 'unknown',
    appId: req.baseUrl.split('/')[2] // Assuming /api/{appId}/...
  };
}

/**
 * Standard error handler middleware for micro-apps
 */
export function errorHandler(err, req, res, next) {
  console.error(`[SDK] Error in ${req.baseUrl}:`, err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || 'Internal Server Error',
    traceId: req.headers['x-request-id'] || 'unknown',
    timestamp: Date.now()
  });
}
