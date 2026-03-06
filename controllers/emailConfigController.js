import pool from '../config/db.js';
import nodemailer from 'nodemailer';
import { logger } from '../middlewares/logger.js';

/**
 * Get all email providers
 * @route GET /api/admin/email/providers
 */
export const getProviders = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM email_providers ORDER BY id ASC");
    // Mask passwords for security
    const sanitizedRows = rows.map(provider => ({
      ...provider,
      auth_pass: provider.auth_pass ? '******' : null
    }));
    res.json(sanitizedRows);
  } catch (error) {
    logger.error({ event: "get_email_providers_error", error: error.message });
    res.status(500).json({ message: "获取邮件服务商失败" });
  }
};

/**
 * Create a new email provider
 * @route POST /api/admin/email/providers
 */
export const createProvider = async (req, res) => {
  const { name, host, port, secure, auth_user, auth_pass } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO email_providers (name, host, port, secure, auth_user, auth_pass, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [name, host, port, secure, auth_user, auth_pass]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error({ event: "create_email_provider_error", error: error.message });
    res.status(500).json({ message: "创建邮件服务商失败" });
  }
};

/**
 * Update an email provider
 * @route PUT /api/admin/email/providers/:id
 */
export const updateProvider = async (req, res) => {
  const { id } = req.params;
  const { name, host, port, secure, auth_user, auth_pass } = req.body;

  try {
    // If password is provided, update it; otherwise keep existing
    let query, params;
    if (auth_pass && auth_pass !== '******') {
      query = `UPDATE email_providers 
               SET name = $1, host = $2, port = $3, secure = $4, auth_user = $5, auth_pass = $6, updated_at = NOW()
               WHERE id = $7 RETURNING *`;
      params = [name, host, port, secure, auth_user, auth_pass, id];
    } else {
      query = `UPDATE email_providers 
               SET name = $1, host = $2, port = $3, secure = $4, auth_user = $5, updated_at = NOW()
               WHERE id = $6 RETURNING *`;
      params = [name, host, port, secure, auth_user, id];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "服务商不存在" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error({ event: "update_email_provider_error", error: error.message });
    res.status(500).json({ message: "更新邮件服务商失败" });
  }
};

/**
 * Delete an email provider
 * @route DELETE /api/admin/email/providers/:id
 */
export const deleteProvider = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM email_providers WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "服务商不存在" });
    }
    res.json({ message: "删除成功", id });
  } catch (error) {
    logger.error({ event: "delete_email_provider_error", error: error.message });
    res.status(500).json({ message: "删除邮件服务商失败" });
  }
};

/**
 * Set active provider
 * @route POST /api/admin/email/providers/:id/enable
 */
export const setActiveProvider = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    // Disable all
    await client.query("UPDATE email_providers SET is_active = false");
    // Enable target
    const result = await client.query(
      "UPDATE email_providers SET is_active = true WHERE id = $1 RETURNING *",
      [id]
    );
    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "服务商不存在" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Set Active Provider Error:", error);
    res.status(500).json({ message: "启用服务商失败" });
  } finally {
    client.release();
  }
};

/**
 * Test provider configuration
 * @route POST /api/admin/email/providers/:id/test
 */
export const testProvider = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body; // Test recipient

  try {
    const providerRes = await pool.query("SELECT * FROM email_providers WHERE id = $1", [id]);
    if (providerRes.rows.length === 0) {
      return res.status(404).json({ message: "服务商不存在" });
    }
    const provider = providerRes.rows[0];

    const transporter = nodemailer.createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: {
        user: provider.auth_user,
        pass: provider.auth_pass,
      },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: provider.auth_user,
      to: email,
      subject: "Test Email from IASBT Account System",
      text: "This is a test email to verify your SMTP configuration.",
    });

    res.json({ message: "测试邮件发送成功" });
  } catch (error) {
    console.error("Test Provider Error:", error);
    res.status(500).json({ message: "测试失败: " + error.message });
  }
};

/**
 * Get email logs
 * @route GET /api/admin/email/logs
 */
export const getEmailLogs = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = "SELECT * FROM email_logs";
    let countQuery = "SELECT COUNT(*) FROM email_logs";
    let params = [];
    let paramIndex = 1;

    if (status) {
      query += ` WHERE status = $${paramIndex}`;
      countQuery += ` WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const countRes = await pool.query(countQuery, status ? [status] : []);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(query, params);
    
    res.json({
      data: dataRes.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error("Get Email Logs Error:", error);
    res.status(500).json({ message: "获取邮件日志失败" });
  }
};

/**
 * Get email statistics
 * @route GET /api/admin/email/stats
 */
export const getEmailStats = async (req, res) => {
  try {
    const totalRes = await pool.query("SELECT COUNT(*) FROM email_logs");
    const sentRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status = 'sent'");
    const failedRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status = 'failed'");
    const pendingRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status = 'pending'");

    const totalSent = parseInt(totalRes.rows[0].count, 10);
    const sentCount = parseInt(sentRes.rows[0].count, 10);
    const failedCount = parseInt(failedRes.rows[0].count, 10);
    const pendingCount = parseInt(pendingRes.rows[0].count, 10);
    const successRate = totalSent > 0 ? ((sentCount / totalSent) * 100).toFixed(1) : 0;

    // 24h Trend (Last 24 hours)
    const trendRes = await pool.query(`
      SELECT 
        to_char(created_at, 'YYYY-MM-DD HH24:00') as hour,
        COUNT(*) as count
      FROM email_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour ASC
    `);

    const normalizedTrend = trendRes.rows.map((item) => ({
      hour: item.hour,
      count: parseInt(item.count, 10)
    }));

    res.json({
      success: true,
      stats: {
        total: totalSent,
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        success_rate: parseFloat(successRate),
        trend: normalizedTrend.map((item) => ({
          hour: item.hour,
          sent: item.count,
          failed: 0
        }))
      },
      total_sent: totalSent,
      success_rate: parseFloat(successRate),
      trend: normalizedTrend
    });
  } catch (error) {
    console.error("Get Email Stats Error:", error);
    res.status(500).json({ message: "获取统计数据失败" });
  }
};

/**
 * Get email templates
 * @route GET /api/admin/email/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM email_templates ORDER BY type ASC");
    res.json(rows);
  } catch (error) {
    console.error("Get Templates Error:", error);
    res.status(500).json({ message: "获取模板列表失败" });
  }
};

/**
 * Update email template
 * @route PUT /api/admin/email/templates/:type
 */
export const updateTemplate = async (req, res) => {
  const { type } = req.params;
  const { subject, content, variables } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO email_templates (type, subject, content, variables, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (type) 
       DO UPDATE SET 
         subject = EXCLUDED.subject, 
         content = EXCLUDED.content, 
         variables = EXCLUDED.variables,
         updated_at = NOW()
       RETURNING *`,
      [type, subject, content, JSON.stringify(variables)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update Template Error:", error);
    res.status(500).json({ message: "更新模板失败" });
  }
};
