import { addEmailJob } from "./emailQueue.js";
import nodemailer from "nodemailer";
import { config } from "../config/index.js";

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
    console.log("Message sent (Direct): %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email (Direct):", error);
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
    console.log(`Email job added to queue: ${job.id} (${type} -> ${to})`);
    return true;
  } catch (error) {
    console.error("Failed to add email to queue:", error);
    // Fallback to direct send if Redis is down?
    // For V2.0 strict mode, we might want to fail or fallback.
    // Let's fallback for robustness during migration.
    console.warn("Falling back to direct send...");
    return sendEmailDirect(to, subject, html);
  }
};
