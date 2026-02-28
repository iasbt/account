
import pool from "../config/db.js";
import { recordAuthFailure } from "../middlewares/metrics.js";

export const AuditEvent = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAIL: "LOGIN_FAIL",
  REGISTER: "REGISTER",
  LOGOUT: "LOGOUT",
  SSO_AUTH: "SSO_AUTH",
  SSO_FAIL: "SSO_FAIL",
  ADMIN_LOGIN: "ADMIN_LOGIN",
  ADMIN_ACTION: "ADMIN_ACTION"
};

export const auditLogger = {
  /**
   * Log a security event
   * @param {string} eventType - One of AuditEvent values
   * @param {object} req - Express request object (for IP/UserAgent)
   * @param {object} details - JSON details about the event
   * @param {string|null} userId - User ID if known
   */
  async log(eventType, req, details = {}, userId = null) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Ensure details is an object
      const safeDetails = typeof details === 'object' ? details : { info: details };

      // Increment Prometheus Counter for failures
      if (eventType === AuditEvent.LOGIN_FAIL || eventType === AuditEvent.SSO_FAIL) {
        recordAuthFailure(eventType === AuditEvent.SSO_FAIL ? 'sso' : 'login');
      }

      await pool.query(
        `INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, eventType, ip, userAgent, safeDetails]
      );
    } catch (err) {
      console.error(`[AuditLogger] Failed to log event ${eventType}:`, err.message);
      // We do not throw here to prevent blocking the main flow
    }
  }
};
