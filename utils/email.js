import { addEmailJob } from "./emailQueue.js";
import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

// Legacy direct send for debugging or fallback
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, 
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendEmailDirect = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"IASBT Account" <${config.smtp.user}>`,
      to,
      subject,
      html,
    });
    logger.info({ event: "email_sent_direct", messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error({ event: "email_error_direct", error: error.message });
    return false;
  }
};

/**
 * Send email using async queue (BullMQ)
 * @param {string} to 
 * @param {string} subject 
 * @param {string} html 
 * @param {string} type - Template type for logging (e.g., 'register', 'reset')
 */
export const sendEmail = async (to, subject, html, type = 'general') => {
  try {
    const job = await addEmailJob(to, subject, html, type);
    logger.info({ event: "email_queued", jobId: job.id, type, to });
    return true;
  } catch (error) {
    logger.error({ event: "email_queue_error", error: error.message });
    logger.warn({ event: "email_fallback_direct" });
    return sendEmailDirect(to, subject, html);
  }
};
