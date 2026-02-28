# 任务：集成 Image Gallery 后端逻辑 (v2.1 - 完整修复版)

## 背景
前端 (http://119.91.71.30:5173) 迁移至 Account System 后出现以下阻断性问题：
1. **API 404**: `/user/preferences`, `/user/onboarding` (POST), `/images`, `/categories` 接口缺失。
2. **CORS Error**: Nginx 未代理上述路径，导致跨域预检失败。
3. **Auth 401**: SSO Token 签名验证失败（Secret 不匹配）。

## 目标
请执行以下变更以完整支持 Image Gallery 业务。

---

### 1. 数据库变更 (Database Schema)
请在数据库中创建 Gallery 相关表结构，**新增用户偏好表**以解耦核心用户表。

**执行 SQL:**
```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  has_accepted_terms BOOLEAN DEFAULT FALSE,
  has_seen_onboarding BOOLEAN DEFAULT FALSE,
  category_order JSONB DEFAULT '[]'::jsonb,
  hidden_category_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  exif JSONB,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_tags (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_category_id ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
```

---

### 2. 后端逻辑实现 (Backend Logic)

#### 2.1 创建 `controllers/galleryController.js`
实现图片、分类及**用户偏好**的 CRUD。

```javascript
import pool from "../db.js";

export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT * FROM user_preferences WHERE user_id = $1", [userId]);
    
    if (result.rowCount === 0) {
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
    res.status(500).json({ message: "获取偏好失败" });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hasAcceptedTerms, hasSeenOnboarding, categoryOrder, hiddenCategoryIds } = req.body;

    const query = `
      INSERT INTO user_preferences (user_id, has_accepted_terms, has_seen_onboarding, category_order, hidden_category_ids, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        has_accepted_terms = COALESCE(EXCLUDED.has_accepted_terms, user_preferences.has_accepted_terms),
        has_seen_onboarding = COALESCE(EXCLUDED.has_seen_onboarding, user_preferences.has_seen_onboarding),
        category_order = COALESCE(EXCLUDED.category_order, user_preferences.category_order),
        hidden_category_ids = COALESCE(EXCLUDED.hidden_category_ids, user_preferences.hidden_category_ids),
        updated_at = NOW()
      RETURNING *
    `;
    await pool.query(query, [
      userId,
      hasAcceptedTerms,
      hasSeenOnboarding,
      categoryOrder ? JSON.stringify(categoryOrder) : null,
      hiddenCategoryIds ? JSON.stringify(hiddenCategoryIds) : null
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "更新偏好失败" });
  }
};

export const updateOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { seen } = req.body;

    await pool.query(
      `
        INSERT INTO user_preferences (user_id, has_seen_onboarding, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET has_seen_onboarding = $2, updated_at = NOW()
      `,
      [userId, seen]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Update onboarding error:", error);
    res.status(500).json({ message: "更新引导状态失败" });
  }
};

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
      `
        INSERT INTO images (user_id, title, file_url, file_path, width, height, category_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [userId, title, file_url, file_path, width, height, category_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create image error:", error);
    res.status(500).json({ message: "上传图片失败" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1 ORDER BY sort_order ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
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
    res.status(500).json({ message: "创建分类失败" });
  }
};
```

#### 2.2 创建 `routes/galleryRoutes.js`

```javascript
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getPreferences,
  updatePreferences,
  updateOnboarding,
  getImages,
  createImage,
  getCategories,
  createCategory
} from "../controllers/galleryController.js";

const router = Router();
router.use(requireAuth);

router.get("/user/preferences", getPreferences);
router.patch("/user/preferences", updatePreferences);
router.post("/user/onboarding", updateOnboarding);

router.get("/images", getImages);
router.post("/images", createImage);
router.get("/categories", getCategories);
router.post("/categories", createCategory);

export default router;
```

#### 2.3 挂载路由 (`routes/index.js`)

```javascript
import galleryRoutes from "./galleryRoutes.js";
// ...
router.use("/", galleryRoutes);
```

---

### 3. 修复 Auth 401 (Middleware Fix)

**修改 `utils/token.js` 中的 `verifyToken` (或新增 `verifyAppToken`)**：
必须支持根据 Token 中的 `aud` (App ID) 动态查找 Secret，否则 Image Gallery 的 Token 无法通过验证。

```javascript
export const verifyAppToken = async (token) => {
    // 1. Decode token (no verify) to get 'aud'
    // 2. SELECT secret FROM applications WHERE app_id = aud
    // 3. jwt.verify(token, appSecret || globalSecret)
};
```
*请确保 `middlewares/auth.js` 调用此函数。*

---

### 4. Nginx 配置更新 (Proxy Fix)

修改 Nginx 配置以支持 CORS 和 API 转发。

```nginx
server {
    location ~ ^/(images|categories|user/) {
        proxy_pass http://account-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PATCH, PUT, DELETE';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```
