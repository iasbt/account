import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log the error
  logger.error({
    event: "api_error",
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    message,
    stack: err.stack,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    message: config.env === "production" && statusCode === 500 ? "Internal Server Error" : message,
    stack: config.env === "development" ? err.stack : undefined,
    requestId: req.requestId,
  });
};
