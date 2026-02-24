
import pool from '../db.js';
import { fileURLToPath } from 'url';

const DEFAULTS = {
  register: {
    subject: "欢迎注册 IASBT Account - 验证码",
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>欢迎注册 IASBT Account</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <div style="font-size: 24px; font-weight: 700; color: #0f172a;">IASBT Account</div>
    </div>
    <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
      <h2 style="margin-top: 0; color: #1e293b;">欢迎注册</h2>
      <p>感谢您注册 IASBT Account，请使用以下验证码完成注册流程：</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 4px; font-family: monospace;">{{code}}</span>
      </div>
      <p>验证码有效期为 10 分钟，请勿泄露给他人。</p>
    </div>
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e5e7eb;">
      <p>此邮件由系统自动发送，请勿直接回复。</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["code"]
  },
  reset_password: {
    subject: "重置密码验证 - IASBT Account",
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>重置密码验证</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <div style="font-size: 24px; font-weight: 700; color: #0f172a;">IASBT Account</div>
    </div>
    <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
      <h2 style="margin-top: 0; color: #1e293b;">重置密码</h2>
      <p>您正在申请重置密码，请使用以下验证码验证您的身份：</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 4px; font-family: monospace;">{{code}}</span>
      </div>
      <p>如果您未请求重置密码，请忽略此邮件。</p>
    </div>
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e5e7eb;">
      <p>此邮件由系统自动发送，请勿直接回复。</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["code"]
  },
  general: {
    subject: "系统通知 - IASBT Account",
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>系统通知</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <div style="font-size: 24px; font-weight: 700; color: #0f172a;">IASBT Account</div>
    </div>
    <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
      <h2 style="margin-top: 0; color: #1e293b;">{{title}}</h2>
      <p>{{content}}</p>
    </div>
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e5e7eb;">
      <p>此邮件由系统自动发送，请勿直接回复。</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["title", "content"]
  }
};

export const initEmailTemplates = async () => {
  try {
    console.log("Initializing Email Templates Table...");

    // 1. Create Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.email_templates (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        variables JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Table 'email_templates' ready.");

    // 2. Seed Data
    for (const [type, data] of Object.entries(DEFAULTS)) {
      try {
        await pool.query(
          `INSERT INTO public.email_templates (type, subject, content, variables)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (type) DO NOTHING`, // Only insert if not exists to preserve edits
          [type, data.subject, data.content, JSON.stringify(data.variables)]
        );
        console.log(`Seeded template: ${type}`);
      } catch (err) {
        console.error(`Failed to seed ${type}:`, err);
      }
    }

    console.log("Initialization complete.");
  } catch (err) {
    console.error("Error initializing email templates:", err);
  }
};

// Only run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initEmailTemplates().then(() => process.exit(0));
}
