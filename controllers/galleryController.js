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
