import pool from "../db.js";

/**
 * Get all email providers
 * @route GET /api/admin/email/providers
 */
export const getProviders = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, host, port, secure, auth_user, is_active, from_name, from_email, created_at FROM email_providers ORDER BY id ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Get Providers Error:", error);
    res.status(500).json({ message: "获取邮件服务配置失败" });
  }
};

/**
 * Create a new email provider
 * @route POST /api/admin/email/providers
 */
export const createProvider = async (req, res) => {
  const { name, host, port, secure, auth_user, auth_pass, from_name, from_email } = req.body;
  
  if (!name || !host || !port) {
    return res.status(400).json({ message: "名称、主机和端口为必填项" });
  }

  try {
    // Ideally encrypt auth_pass here
    const encryptedPass = auth_pass; // Placeholder for encryption

    const { rows } = await pool.query(
      `INSERT INTO email_providers (
        name, host, port, secure, auth_user, auth_pass_encrypted, from_name, from_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, created_at`,
      [name, host, port, secure, auth_user, encryptedPass, from_name, from_email]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create Provider Error:", error);
    res.status(500).json({ message: "创建配置失败" });
  }
};

/**
 * Update an email provider
 * @route PUT /api/admin/email/providers/:id
 */
export const updateProvider = async (req, res) => {
  const { id } = req.params;
  const { name, host, port, secure, auth_user, auth_pass, from_name, from_email } = req.body;

  try {
    // Build update query dynamically
    let query = `UPDATE email_providers SET 
      name = $1, host = $2, port = $3, secure = $4, 
      auth_user = $5, from_name = $6, from_email = $7, 
      updated_at = NOW()`;
    
    const params = [name, host, port, secure, auth_user, from_name, from_email];
    let paramIndex = 8;

    if (auth_pass) {
      query += `, auth_pass_encrypted = $${paramIndex}`;
      params.push(auth_pass);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, name`;
    params.push(id);

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: "配置不存在" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Update Provider Error:", error);
    res.status(500).json({ message: "更新配置失败" });
  }
};

/**
 * Delete a provider
 * @route DELETE /api/admin/email/providers/:id
 */
export const deleteProvider = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Check if active
    const check = await client.query("SELECT is_active FROM email_providers WHERE id = $1", [id]);
    if (check.rows.length > 0 && check.rows[0].is_active) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "无法删除当前激活的配置，请先切换其他配置" });
    }

    // Detach logs
    await client.query("UPDATE email_logs SET provider_id = NULL WHERE provider_id = $1", [id]);
    
    // Delete
    const { rowCount } = await client.query("DELETE FROM email_providers WHERE id = $1", [id]);
    
    if (rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "配置不存在" });
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "删除成功" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete Provider Error:", error);
    res.status(500).json({ message: "删除失败" });
  } finally {
    client.release();
  }
};

/**
 * Set active provider
 * @route POST /api/admin/email/providers/:id/activate
 */
export const setActiveProvider = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    // Deactivate all
    await client.query("UPDATE email_providers SET is_active = false");
    // Activate target
    const { rowCount } = await client.query(
      "UPDATE email_providers SET is_active = true WHERE id = $1", 
      [id]
    );

    if (rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "配置不存在" });
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "已切换当前邮件服务配置" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Activate Provider Error:", error);
    res.status(500).json({ message: "切换配置失败" });
  } finally {
    client.release();
  }
};

/**
 * Get email logs
 * @route GET /api/admin/email/logs
 */
export const getEmailLogs = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT l.*, p.name as provider_name 
      FROM email_logs l
      LEFT JOIN email_providers p ON l.provider_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND l.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (l.recipient ILIKE $${paramIndex} OR l.subject ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('l.*, p.name as provider_name', 'COUNT(*)');
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count);

    // Get data
    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    res.json({
      logs: rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Get Logs Error:", error);
    res.status(500).json({ message: "获取日志失败" });
  }
};

/**
 * Send a test email
 * @route POST /api/admin/email/providers/:id/test
 */
export const testProvider = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "收件人邮箱必填" });

  try {
    // 1. Get Provider
    const { rows } = await pool.query(
      "SELECT * FROM email_providers WHERE id = $1", 
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "配置不存在" });
    }

    const provider = rows[0];

    // 2. Create Transporter
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: {
        user: provider.auth_user,
        pass: provider.auth_pass_encrypted // Assume decrypted or plain for now
      }
    });

    // 3. Send
    await transporter.sendMail({
      from: `"${provider.from_name}" <${provider.from_email}>`,
      to: email,
      subject: "Test Email from Account System",
      html: `
        <h3>邮件服务配置测试</h3>
        <p>这是一封测试邮件，用于验证邮件服务配置是否正确。</p>
        <ul>
          <li><strong>配置名称:</strong> ${provider.name}</li>
          <li><strong>Host:</strong> ${provider.host}</li>
          <li><strong>Port:</strong> ${provider.port}</li>
          <li><strong>发送时间:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      `
    });

    res.json({ success: true, message: "测试邮件发送成功" });
  } catch (error) {
    console.error("Test Provider Error:", error);
    res.status(500).json({ message: "发送失败: " + error.message });
  }
};

/**
 * Get email statistics
 * @route GET /api/admin/email/stats
 */
export const getEmailStats = async (req, res) => {
  try {
    const totalRes = await pool.query("SELECT COUNT(*) FROM email_logs");
    const total = parseInt(totalRes.rows[0].count);

    const sentRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status = 'sent'");
    const sent = parseInt(sentRes.rows[0].count);

    const failedRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status = 'failed'");
    const failed = parseInt(failedRes.rows[0].count);

    const pendingRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status IN ('pending', 'queued', 'sending')");
    const pending = parseInt(pendingRes.rows[0].count);

    const success_rate = total > 0 ? Math.round((sent / total) * 100) : 0;

    res.json({
      stats: {
        total,
        sent,
        failed,
        pending,
        success_rate
      }
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ message: "获取统计数据失败" });
  }
};
