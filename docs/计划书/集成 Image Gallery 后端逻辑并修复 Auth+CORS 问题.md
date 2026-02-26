# 任务：集成 Image Gallery 后端逻辑并修复 Auth/CORS 问题

## 背景
我们已将 Image Gallery 项目的前端从 Supabase 迁移到了 Account System (Express + PostgreSQL)。
目前前端 (http://119.91.71.30:5173) 遇到以下问题：
1. **Logout 404**: 点击退出时，后端缺少 `/auth/logout` 路由（或 Nginx 未正确代理）。
2. **API 404/CORS**: 访问 `/images`, `/categories` 等接口时报 404 或 CORS 错误，原因是 Nginx 未代理这些路径，且后端未实现对应业务逻辑。
3. **Auth 401**: 访问 `/auth/me` 时报 401 Unauthorized，原因是 SSO 颁发的 Token 可能使用了 App 专属 Secret，而后端验证时默认使用了全局 Secret。

## 目标
请在 Account System 项目中执行以下变更，以支持 Image Gallery 的业务需求。

---

### 1. 数据库变更 (Database Schema)
请在数据库中创建 Gallery 相关的表结构。
**执行 SQL:**
```sql
-- Gallery Tables

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images
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

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image Tags Junction
CREATE TABLE IF NOT EXISTS image_tags (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_category_id ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
```

---

### 2. 后端逻辑实现 (Backend Logic)

#### 2.1 创建 `controllers/galleryController.js`
实现图片和分类的 CRUD 逻辑。

```javascript
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
定义路由。

```javascript
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getImages, createImage, getCategories, createCategory } from "../controllers/galleryController.js";

const router = Router();

router.use(requireAuth); // Protect all routes

// Images
router.get("/images", getImages);
router.post("/images", createImage);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// User Onboarding (Mock for now to fix 404)
router.get("/user/onboarding", (req, res) => {
  res.json({ completed: true });
});

export default router;
```

#### 2.3 更新 `app.js` 或 `routes/index.js`
挂载新路由。

```javascript
// 在 routes/index.js 中添加:
import galleryRoutes from "./galleryRoutes.js";

// ...
router.use("/", galleryRoutes); // Mount at root so /images works
```

---

### 3. 修复 Auth 401 问题 (Middleware Fix)

SSO 颁发的 Token 可能使用了特定 App 的 Secret，而 `requireAuth` 默认只验证全局 Secret。需要修改 `middlewares/auth.js` 或 `utils/token.js` 以支持动态 Secret 验证。

**修改 `utils/token.js` 中的 `verifyToken` 函数 (或新建 `verifyAppToken`)：**

```javascript
import jwt from "jsonwebtoken";
import pool from "../db.js"; // 引入 DB
import { config } from "../config/index.js";

export const verifyAppToken = async (token) => {
  try {
    // 1. 先不验证签名，解码 Token 获取 aud (App ID)
    const decoded = jwt.decode(token);
    if (!decoded) return null;

    let secret = config.ssoSecret;

    // 2. 如果有 aud，查询 App 专属 Secret
    if (decoded.aud) {
      const result = await pool.query(
        "SELECT secret FROM applications WHERE app_id = $1 LIMIT 1",
        [decoded.aud]
      );
      if (result.rowCount > 0 && result.rows[0].secret) {
        secret = result.rows[0].secret;
      }
    }

    // 3. 使用正确的 Secret 验证签名
    return jwt.verify(token, secret);
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
};
```

**并在 `middlewares/auth.js` 中使用新的验证逻辑：**
```javascript
import { verifyAppToken } from "../utils/token.js";

export const getAuthUser = async (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  return await verifyAppToken(token); // 使用支持多 Secret 的验证函数
};
```

---

### 4. Nginx 配置更新 (Proxy Fix)

修改部署服务器上的 Nginx 配置 (`/etc/nginx/conf.d/default.conf` 或项目目录下的 `deploy/correction/nginx.conf`)，确保 `/images` 等路径被代理到后端。

```nginx
server {
    listen 80;
    # ...

    # 现有的 /auth 代理
    location /auth/ {
        proxy_pass http://account-backend:3000;
        # ... standard proxy headers ...
    }

    # === 新增：Gallery API 代理 ===
    location /images {
        proxy_pass http://account-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /categories {
        proxy_pass http://account-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /user/ {
        proxy_pass http://account-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    # ============================
}
```

### 5. 部署
1. 提交代码到 Account System 仓库。
2. 在服务器上运行数据库迁移 SQL。
3. 重新部署 Account System 后端。
4. 重载 Nginx 配置 (`nginx -s reload`)。
