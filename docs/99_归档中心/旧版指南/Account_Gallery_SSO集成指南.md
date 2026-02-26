# 子系统接入指南 (旧版)

> **状态**: 已实施
> **日期**: 2026-02-24
> **适用**: Account（提供方）→ Gallery、Toolbox、LifeOS（使用方）
> **更新**: V2.1 引入了数据库注册表与可视化管理后台。

## 1. 核心流程

这是一个 **基于前端中转** 的 SSO 流程，旨在解决 Cookie/Token 跨域问题并兼容多种客户端（Supabase / Standard JWT）。

1.  **用户访问子应用（如 Gallery）**: 用户点击 "Login with Account"。
2.  **跳转**: 子应用将用户重定向到 Account 前端页面：
    *   URL: `https://account.iasbt.com/sso/issue?target=https://gallery.iasbt.com/auth/callback`
3.  **Account 检查**:
    *   Account 前端（`SsoPage`）检查本地是否已登录。
    *   **未登录**: 跳转至 `/login`，登录成功后自动跳回 `/sso/issue`。
    *   **已登录**: 调用后端接口 `/api/sso/issue` 获取授权凭证。
4.  **应用匹配与凭证生成（V2.1 动态）**:
    *   后端根据 `target` URL 在 **数据库 (`applications` 表)** 中查找匹配的应用配置。
    *   **Gallery（Supabase）**: 生成包含 `aud: authenticated`, `role: authenticated` 的 Supabase 兼容 JWT。
    *   **Toolbox（Standard）**: 生成标准 JWT。
    *   **密钥隔离**: 使用数据库中存储的应用专属 `secret` 进行签名。
5.  **回调**: Account 前端将用户重定向回子应用，携带 Hash 片段。

## 2. 应用注册表

V2.1 废弃了静态配置文件，改为 **PostgreSQL 数据库驱动**。

### 2.1 注册新应用
**推荐**: 直接在管理员后台进行可视化操作。

1.  登录管理员后台: `/admin/login`
2.  进入 **“应用接入”** 模块。
3.  点击 **“新建应用”**。
4.  填写表单:
    *   **Name**: 应用名称（如 "Image Gallery"）
    *   **App ID**: 唯一标识（如 "gallery"）
    *   **Origins**: 允许的域名（如 `http://119.91.71.30` 或 `http://119.91.71.30:5173`），一行一个。
    *   **Token Type**: 选择 `Supabase Compatible`（若子应用使用 Supabase 客户端）或 `Standard JWT`。
5.  **Secret**: 系统会自动生成高强度密钥，请复制并配置到子应用的 `.env` 中。

### 2.2 环境变量配置（子应用端）

在子应用（如 Gallery）中：

```ini
# Account 系统的 SSO 密钥（必须与 Admin 后台中生成的 Secret 一致）
SUPABASE_JWT_SECRET=your-generated-secret-from-admin-panel
```

## 3. 代码实现摘要

### 3.1 Account 后端（`ssoController.js`）
已升级为数据库查询模式：

```javascript
// 1. 匹配应用（Database）
const result = await pool.query(
  `SELECT * FROM public.applications 
   WHERE ($1 = ANY(allowed_origins) OR $2 = ANY(allowed_origins))
   AND is_active = true`,
  [origin, target]
);

// 2. 选择策略
const app = result.rows[0];
if (app.token_type === 'supabase') {
  accessToken = generateSupabaseToken(user, app.secret);
} else {
  accessToken = signToken(payload, 3600, app.secret);
}
```

## 4. 故障排查

*   **Q: 提示 "目标域名不允许（Unknown Application）"**
    *   登录 Admin 后台，检查该应用的 `Allowed Origins` 是否包含当前域名。
    *   检查应用是否处于“启用”状态 (`is_active`)。
*   **Q: Gallery 提示 "Auth session missing!"**
    *   检查 Admin 后台显示的 Secret 是否与 Gallery `.env` 中的 `SUPABASE_JWT_SECRET` 一致。
*   **Q: 登录后跳回 Account 首页而不是子应用**
    *   检查 URL 参数 `target` 是否被正确 URL 编码。

## 5. 维护
*   **新增子项目**: 无需修改代码，直接在 `/admin` 后台添加。
*   **密钥轮换**: 在后台点击“刷新密钥”按钮生成新 Secret，并同步更新子应用配置。
