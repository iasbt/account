import pool from "../db.js";

// Images
export const getImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id } = req.query;
    
    let query = `
      SELECT i.*, 
             json_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM images i
      LEFT JOIN image_tags it ON i.id = it.image_id
      LEFT JOIN tags t ON it.tag_id = t.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
    `;
    const params = [userId];

    if (category_id) {
      query += ` AND i.category_id = $2`;
      params.push(category_id);
    }

    query += ` GROUP BY i.id ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get images error:", error);
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
    console.error("Create image error:", error);
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
    console.error("Get categories error:", error);
    res.status(500).json({ message: "获取分类失败" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;
    const result = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create category error:", error);
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
      categoryOrder: row.category_order,
      hiddenCategoryIds: row.hidden_category_ids
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ message: "获取偏好设置失败" });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hasAcceptedTerms, hasSeenOnboarding, categoryOrder, hiddenCategoryIds } = req.body;

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, has_accepted_terms, has_seen_onboarding, category_order, hidden_category_ids, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         has_accepted_terms = COALESCE(EXCLUDED.has_accepted_terms, user_preferences.has_accepted_terms),
         has_seen_onboarding = COALESCE(EXCLUDED.has_seen_onboarding, user_preferences.has_seen_onboarding),
         category_order = COALESCE(EXCLUDED.category_order, user_preferences.category_order),
         hidden_category_ids = COALESCE(EXCLUDED.hidden_category_ids, user_preferences.hidden_category_ids),
         updated_at = NOW()
       RETURNING *`,
      [
        userId, 
        hasAcceptedTerms !== undefined ? hasAcceptedTerms : null, 
        hasSeenOnboarding !== undefined ? hasSeenOnboarding : null, 
        categoryOrder ? JSON.stringify(categoryOrder) : null, 
        hiddenCategoryIds ? JSON.stringify(hiddenCategoryIds) : null
      ]
    );

    const row = result.rows[0];
    res.json({
      hasAcceptedTerms: row.has_accepted_terms,
      hasSeenOnboarding: row.has_seen_onboarding,
      categoryOrder: row.category_order,
      hiddenCategoryIds: row.hidden_category_ids
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "更新偏好设置失败" });
  }
};

export const updateOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { seen } = req.body; // Frontend sends: { seen: boolean }

    await pool.query(
      `INSERT INTO user_preferences (user_id, has_seen_onboarding, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET has_seen_onboarding = $2, updated_at = NOW()`,
      [userId, seen]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Update onboarding error:", error);
    res.status(500).json({ message: "更新引导状态失败" });
  }
};
