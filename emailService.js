import nodemailer from "nodemailer";

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
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>账号注册验证码</h2>
      <p>您的验证码是：<strong>${code}</strong></p>
      <p>该验证码 5 分钟内有效，请尽快完成注册。</p>
    </div>
  `;

  return transporter.sendMail({
    from: '"iasbt_account" <Account@notice.iasbt.com>',
    to: toEmail,
    subject: "账号注册验证码",
    html,
  });
}
