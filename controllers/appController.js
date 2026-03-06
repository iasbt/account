
import pool from '../config/db.js';
import crypto from 'crypto';
import { logger } from '../middlewares/logger.js';

// Helper: Generate secure secret
const generateSecret = () => crypto.randomBytes(32).toString('hex');

// Create
export const createApp = async (req, res) => {
  let { name, appId, allowedOrigins, secret } = req.body;
  
  if (!name || !appId || !allowedOrigins) {
    return res.status(400).json({ message: "Name, App ID, and Allowed Origins are required" });
  }

  // Auto-generate secret if not provided
  if (!secret) {
    secret = generateSecret();
  }

  // Validate App ID format (lowercase, numbers, hyphens, underscores)
  if (!/^[a-z0-9-_]+$/.test(appId)) {
    return res.status(400).json({ message: "App ID must contain only lowercase letters, numbers, hyphens, and underscores" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.applications (app_id, name, allowed_origins, secret)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [appId, name, allowedOrigins, secret]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ message: "App ID already exists" });
    }
    logger.error({ event: "create_app_error", error: err.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Read All
export const getApps = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.applications ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    logger.error({ event: "get_apps_error", error: err.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Read One
export const getApp = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM public.applications WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "App not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ event: "get_app_error", error: err.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update
export const updateApp = async (req, res) => {
  const { id } = req.params;
  const { name, appId, allowedOrigins, secret, isActive } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.applications
       SET name = $1, app_id = $2, allowed_origins = $3, secret = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, appId, allowedOrigins, secret, isActive, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "App not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: "App ID already exists" });
    }
    logger.error({ event: "update_app_error", error: err.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

// Rotate Secret
export const rotateSecret = async (req, res) => {
  const { id } = req.params;
  const newSecret = generateSecret();

  try {
    const result = await pool.query(
      `UPDATE public.applications
       SET secret = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING secret`,
      [newSecret, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "App not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Rotate secret error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete
export const deleteApp = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM public.applications WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "App not found" });
    }
    res.json({ message: "App deleted successfully" });
  } catch (err) {
    console.error("Delete app error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
