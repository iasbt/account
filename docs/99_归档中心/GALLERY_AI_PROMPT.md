# Gallery 项目 AI Agent 提示词 (Prompt for Gallery Project AI Agent)

请复制以下指令并提供给负责管理 **Image Gallery Project** (`C:\My_Project\image`) 的 AI 助手。

---

## 🤖 角色：Gallery 项目维护者 (Gallery Project Maintainer)

**目标 (Objective)**：配置 Image Gallery 项目以集成中央账户系统 (Central Account System) 实现单点登录 (SSO)。

**背景 (Context)**：
**账户系统 (Account System)**（部署在 `http://119.91.71.30`）现在作为身份提供商 (IdP)。原有的 Supabase 后端在认证方面已被废弃。我们必须配置 Gallery 应用以接受账户系统颁发的 JWT。

### 📋 任务清单 (Task Checklist)

#### 1. 配置环境变量 (`.env`)
*   `VITE_ACCOUNT_URL`: `http://119.91.71.30` (或 `https://account.iasbt.com`)
*   `VITE_SUPABASE_URL`: `http://119.91.71.30` (代理至账户系统)
*   `VITE_SUPABASE_ANON_KEY`: `any-string-works` (账户系统不验证此项，但客户端需要)
*   `VITE_SUPABASE_JWT_SECRET`: 来自账户管理面板 (Application Registry) 的密钥 (Secret)。

#### 2. 更新认证回调 (`src/auth/AuthCallback.tsx` 或类似文件)
确保回调页面能处理 URL 哈希 (Hash) 中的 `access_token`。
*   账户系统重定向回：`http://localhost:5173/auth/callback#access_token=...&refresh_token=...`
*   如果 `VITE_SUPABASE_URL` 指向正确，Supabase 客户端 `supabase.auth.getSession()` 或 `setSession()` 应能自动处理此情况。

#### 3. 更新账户系统中的允许来源 (Allowed Origins)
确保您的 Gallery URL（例如 `http://119.91.71.30:5173` 或 `http://localhost:5173`）已添加到账户系统管理面板的 **应用注册表 (Application Registry)** 中。

#### 4. 检查混合内容 (Mixed Content)
如果 Gallery 使用 HTTPS (Vercel)，则账户系统必须也是 HTTPS。
当前状态：账户系统是 HTTP (`119.91.71.30`)。
**行动 (Action)**：建议将 Gallery 部署到同一服务器使用 IP 访问（当前推荐），或为账户系统配置 SSL。

---
