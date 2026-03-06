import pool from "../config/db.js";
import { logger } from "../utils/logger.js";

// Images
export const getImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id } = req.query;
    
    let query = `
      SELECT i.*, 
             COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') as tags
      FROM images i
      LEFT JOIN image_tags it ON i.id = it.image_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
    `;
    const params = [userId];

    if (category_id) {
      params.push(category_id);
      query += ` AND i.category_id = $${params.length}`;
    }

    query += ` GROUP BY i.id ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error({ event: "gallery_get_images_error", error: error.message });
    res.status(500).json({ message: "获取图片失败" });
  }
};

export const createImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, file_url, file_path, width, height, category_id } = req.body;

    const result = await pool.query(
      `INSERT INTO images (user_id, title, file_url, file_path, width, height, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, file_url, file_path, width, height, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error({ event: "gallery_create_image_error", error: error.message });
    res.status(500).json({ message: "上传图片失败" });
  }
};

// Categories
export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1 ORDER BY sort_order ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error({ event: "gallery_get_categories_error", error: error.message });
    res.status(500).json({ message: "获取分类失败" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;
    
    // Simple validation
    if (!name) {
        return res.status(400).json({ message: "分类名称不能为空" });
    }

    const result = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, name, color || '#000000']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error({ event: "gallery_create_category_error", error: error.message });
    res.status(500).json({ message: "创建分类失败" });
  }
};

// Preferences
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT * FROM user_preferences WHERE user_id = $1", [userId]);
    
    if (result.rowCount === 0) {
      // Default
      return res.json({
        hasAcceptedTerms: false,
        hasSeenOnboarding: false,
        categoryOrder: [],
        hiddenCategoryIds: []
      });
    }

    const row = result.rows[0];
    res.json({
      hasAcceptedTerms: row.has_accepted_terms,
      hasSeenOnboarding: row.has_seen_onboarding,
      categoryOrder: row.category_order || [],
      hiddenCategoryIds: row.hidden_category_ids || []
    });
  } catch (error) {
    logger.error({ event: "gallery_get_preferences_error", error: error.message });
    res.status(500).json({ message: "获取偏好设置失败" });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hasAcceptedTerms, hasSeenOnboarding, categoryOrder, hiddenCategoryIds } = req.body;

    // Upsert
    const query = `
      INSERT INTO user_preferences (user_id, has_accepted_terms, has_seen_onboarding, category_order, hidden_category_ids, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        has_accepted_terms = COALESCE($2, user_preferences.has_accepted_terms),
        has_seen_onboarding = COALESCE($3, user_preferences.has_seen_onboarding),
        category_order = COALESCE($4, user_preferences.category_order),
        hidden_category_ids = COALESCE($5, user_preferences.hidden_category_ids),
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await pool.query(query, [
        userId, 
        hasAcceptedTerms, 
        hasSeenOnboarding, 
        JSON.stringify(categoryOrder), 
        JSON.stringify(hiddenCategoryIds)
    ]);

    const row = result.rows[0];
    res.json({
      hasAcceptedTerms: row.has_accepted_terms,
      hasSeenOnboarding: row.has_seen_onboarding,
      categoryOrder: row.category_order,
      hiddenCategoryIds: row.hidden_category_ids
    });
  } catch (error) {
    logger.error({ event: "gallery_update_preferences_error", error: error.message });
    res.status(500).json({ message: "更新偏好设置失败" });
  }
};

export const updateOnboarding = async (req, res) => {
    try {
        const userId = req.user.id;
        const { completed } = req.body;
        
        await pool.query(
            `INSERT INTO user_preferences (user_id, has_seen_onboarding)
             VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET has_seen_onboarding = $2`,
            [userId, completed]
        );
        
        res.json({ success: true });
    } catch (error) {
        logger.error({ event: "gallery_update_onboarding_error", error: error.message });
        res.status(500).json({ message: "Update failed" });
    }
};

export const getOnboarding = async (req, res) => {
  try {
    const result = await pool.query("SELECT has_seen_onboarding FROM user_preferences WHERE user_id = $1", [req.user.id]);
    const completed = result.rows[0]?.has_seen_onboarding || false;
    res.json({ completed });
  } catch (error) {
    logger.error({ event: "gallery_get_onboarding_error", error: error.message });
    res.status(500).json({ completed: false });
  }
};
