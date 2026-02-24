
import pool from '../db.js';

// Create
export const createApp = async (req, res) => {
  const { name, appId, allowedOrigins, tokenType, secret } = req.body;
  
  if (!name || !appId || !allowedOrigins || !tokenType || !secret) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.applications (app_id, name, allowed_origins, token_type, secret)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [appId, name, allowedOrigins, tokenType, secret]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ message: "App ID already exists" });
    }
    console.error("Create app error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Read All
export const getApps = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.applications ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Get apps error", err);
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
    console.error("Get app error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update
export const updateApp = async (req, res) => {
  const { id } = req.params;
  const { name, appId, allowedOrigins, tokenType, secret, isActive } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.applications
       SET name = $1, app_id = $2, allowed_origins = $3, token_type = $4, secret = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, appId, allowedOrigins, tokenType, secret, isActive, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "App not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: "App ID already exists" });
    }
    console.error("Update app error", err);
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
