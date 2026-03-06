
import { logger } from './logger.js';
import pool from '../config/db.js';

const styles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
  `,
  header: `
    background-color: #f8fafc;
    padding: 24px;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
  `,
  logo: `
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    text-decoration: none;
    letter-spacing: -0.5px;
  `,
  content: `
    padding: 32px 24px;
    color: #334155;
    line-height: 1.6;
  `,
  codeContainer: `
    background-color: #f1f5f9;
    padding: 16px;
    border-radius: 6px;
    text-align: center;
    margin: 24px 0;
  `,
  code: `
    font-size: 32px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 4px;
    font-family: monospace;
  `,
  button: `
    display: inline-block;
    background-color: #2563eb;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    margin: 24px 0;
    text-align: center;
  `,
  footer: `
    background-color: #f8fafc;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    border-top: 1px solid #e5e7eb;
  `
};

const layout = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <div style="${styles.logo}">IASBT Account</div>
    </div>
    <div style="${styles.content}">
      ${bodyContent}
    </div>
    <div style="${styles.footer}">
      <p>此邮件由系统自动发送，请勿直接回复。</p>
      <p>&copy; ${new Date().getFullYear()} IASBT. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// In-memory cache
let templateCache = {};

export const loadTemplates = async () => {
  try {
    const res = await pool.query('SELECT type, subject, content FROM public.email_templates');
    if (res.rows.length > 0) {
      res.rows.forEach(row => {
        templateCache[row.type] = row;
      });
      logger.info({
        event: 'email_templates_loaded',
        count: res.rows.length,
        types: Object.keys(templateCache)
      }, 'Email templates loaded from DB');
    }
  } catch (err) {
    logger.error({
      event: 'email_templates_load_failed',
      error: err.message
    }, 'Failed to load email templates from DB');
  }
};

// Initialize cache
loadTemplates();

const replaceVars = (content, vars) => {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};

export const getVerificationCodeTemplate = (code, type = 'general') => {
  const cacheKey = type === 'register' ? 'register' : (type === 'reset_password' ? 'reset_password' : 'general');
  
  // Use DB template if available
  if (templateCache[cacheKey]) {
    // Note: DB templates for 'register'/'reset_password' rely on 'code' variable
    // If type is 'login', it falls back to 'general' or code fallback below if not mapped
    // Currently seed script only has register, reset_password, general.
    // Login will fall back to 'general' cacheKey if we map it, but 'general' expects {{title}} and {{content}}
    // This is a mismatch. 'general' in DB has variables ["title", "content"].
    // 'register' has ["code"].
    
    // If type is 'login', cacheKey is 'general', but 'general' template expects title/content.
    // So if type is login, we should probably fall back to code unless we add a 'login' template to DB.
    // For now, let's stick to the exact matches.
    
    if (templateCache[type]) {
       return replaceVars(templateCache[type].content, { code });
    }
  }

  // Fallback to code
  let title = '账号验证';
  let description = '您正在进行账号验证操作，请使用以下验证码完成验证：';

  if (type === 'register') {
    title = '欢迎注册 IASBT Account';
    description = '感谢您注册 IASBT Account，请使用以下验证码完成注册流程：';
  } else if (type === 'reset_password') {
    title = '重置密码验证';
    description = '您正在申请重置密码，请使用以下验证码验证您的身份：';
  } else if (type === 'login') {
    title = '登录验证';
    description = '您正在进行登录操作，请使用以下验证码完成登录：';
  }

  const body = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${title}</h2>
    <p>${description}</p>
    <div style="${styles.codeContainer}">
      <div style="${styles.code}">${code}</div>
    </div>
    <p style="font-size: 14px; color: #64748b;">该验证码将在 5 分钟后失效。如果您没有请求此验证码，请忽略此邮件。</p>
  `;

  return layout(title, body);
};

export const getPasswordResetLinkTemplate = (link) => {
  if (templateCache['reset_link']) {
    return replaceVars(templateCache['reset_link'].content, { link });
  }

  const title = '重置您的密码';
  const body = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${title}</h2>
    <p>我们收到了重置您 IASBT Account 密码的请求。请点击下面的按钮设置新密码：</p>
    <div style="text-align: center;">
      <a href="${link}" style="${styles.button}">重置密码</a>
    </div>
    <p style="font-size: 14px; color: #64748b;">如果按钮无法点击，请复制以下链接到浏览器访问：</p>
    <p style="font-size: 12px; color: #64748b; word-break: break-all;">${link}</p>
    <p style="font-size: 14px; color: #64748b; margin-top: 24px;">该链接将在 30 分钟后失效。如果您没有请求重置密码，请忽略此邮件，您的账户是安全的。</p>
  `;

  return layout(title, body);
};

export const getNotificationTemplate = (subject, message) => {
  if (templateCache['general']) {
    return replaceVars(templateCache['general'].content, { title: subject, content: message });
  }

  const body = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${subject}</h2>
    <p>${message}</p>
  `;
  return layout(subject, body);
};
