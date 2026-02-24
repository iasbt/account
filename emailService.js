import nodemailer from "nodemailer";
import { getVerificationCodeTemplate } from "./utils/emailTemplates.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  debug: true,
  logger: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendCode(toEmail, code) {
  const html = getVerificationCodeTemplate(code, 'register');

  return transporter.sendMail({
    from: '"iasbt_account" <Account@notice.iasbt.com>',
    to: toEmail,
    subject: "账号注册验证码",
    html,
  });
}
