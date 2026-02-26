# 图库集成终极指南 (旧版)

> **版本**: V1.1 (修正版)
> **日期**: 2026-02-25
> **适用范围**: 将图库项目 (`C:\My_Project\image`) 接入账户系统 (`C:\My_Project\account`)
> **状态**: 已修正 (Account-First Strategy)

## 1. 核心架构说明 (重要修正)

鉴于 **Supabase 后端已废弃**，我们将完全依赖 **Account System** 作为唯一的身份与密钥管理中心。

*   **Account System**: 身份提供商 (IdP) + 密钥生成者。
*   **Gallery Project**: 依赖方 (RP)，其 Supabase 客户端仅作为 JWT 解析器与状态管理器使用。
*   **数据流**: Account 生成 Token -> Gallery 接收 Token -> Gallery (未来) 请求 Account API。
*   **密钥原则**: **Account System 是唯一真理来源**。Gallery 必须适配 Account 生成的密钥，而不是反过来。

---

## 2. 账户系统配置 (Account Side)

### 2.1 确认应用注册
账户系统数据库 (`iasbt-postgres`) 的 `applications` 表中已预置了图库应用。

*   **App ID**: `gallery`
*   **Name**: `Image Gallery`
*   **Allowed Origins**:
        *   `http://119.91.71.30` (生产环境)
        *   `http://119.91.71.30:5173` (生产环境)
        *   `http://119.91.71.30:8080` (生产环境)
        *   `http://localhost:5173` (本地环境)
    *   **Token Type**: `supabase` (保持兼容)
*   **Secret**: `MvVh2XGOWu0axQJFoFYbocTvAXd9tZ9J3NQzAbfIz` (系统生成)

### 2.2 无需操作
**您不需要去任何 Supabase Dashboard 获取密钥**。Account 系统生成的上述 Secret 即为最终密钥。

---

## 3. 图库项目配置 (Gallery Side)

请在 `C:\My_Project\image` 目录下创建或修改 `.env` 文件，使其与 Account 系统对齐。

### 3.1 环境变量配置 (`.env`)

```ini
# 1. Supabase 配置 (伪装模式)
# 说明: 由于 Supabase 后端已废弃，这些值仅用于初始化客户端库，使其不报错。
# URL 指向 Account 系统 (使用默认 80 端口，无需加端口号)
VITE_SUPABASE_URL=http://119.91.71.30
# Anon Key 可以是任意非空字符串，因为 Account 系统主要验证 JWT 签名，不强制校验 Anon Key
VITE_SUPABASE_ANON_KEY=any-random-string-for-initialization

# 2. Account SSO 配置 (核心)
# 指向账户系统地址，用于登录跳转 (使用默认 80 端口，无需加端口号)
VITE_ACCOUNT_URL=http://119.91.71.30

# 3. 其他业务配置 (按需填写)
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_code
# 如果有其他后端服务 (如 R2 Worker)，请在此配置
VITE_R2_TOKEN=...
```

### 3.2 🔴 关键动作：手动注入 JWT Secret (如果需要)
通常 `supabase-js` 客户端在前端 **不需要** JWT Secret (它只负责发送 Token)。
但如果您在 Gallery 项目中有任何服务端代码 (如 Node.js 中间件或 API 路由) 需要验证 Token，或者您使用了某些依赖 Secret 的库，请务必使用 **Account 系统生成的 Secret** (`MvVh2XGOWu0axQJFoFYbocTvAXd9tZ9J3NQzAbfIz`)。

> **注意**: 前端 `.env` 中通常不包含 Secret。如果 Gallery 纯粹是前端 SPA，则只要 `VITE_ACCOUNT_URL` 配置正确，SSO 流程即可跑通。

### 3.3 关于端口与 HTTPS 的重要说明 (Critical)

*   **Account System**: 目前运行在 `http://119.91.71.30` (HTTP, 80端口)。
*   **Vercel 部署警告**:
    *   如果您的 Gallery 前端部署在 **Vercel** (强制 HTTPS)，而 Account 系统是 **HTTP**，浏览器会拦截 API 请求 (**Mixed Content Error**)。
    *   **表现**: 登录跳转可以成功 (Redirect 不受限)，但 `supabase-js` 客户端在获取用户信息时可能会失败。
    *   **解决方案**:
        1.  (推荐) 将 Gallery 也部署到 `119.91.71.30` 服务器上 (同为 HTTP)。
        2.  (临时) 使用 Cloudflare 等服务为 `119.91.71.30` 配置 HTTPS 代理 (需域名)。
        3.  (开发) 在本地 `localhost` 调试 (不受 Mixed Content 限制)。

---

## 4. 完整登录流程测试

1.  **启动服务**:
    *   Account: `http://localhost:3000` (或远程 `http://119.91.71.30`)
    *   Gallery: `http://localhost:5173`
2.  **用户点击登录**:
    *   用户访问 Gallery，点击 "Login"。
    *   跳转至: `http://119.91.71.30/sso/issue?target=http://localhost:5173/auth/callback`
3.  **授权与颁发**:
    *   Account 验证用户身份。
    *   Account 使用内部 Secret (`MvVh...`) 签发 JWT。
    *   跳转回: `http://localhost:5173/auth/callback#access_token=...`
4.  **会话建立**:
    *   Gallery 的 `AuthCallback` 捕获 Token。
    *   `supabase.auth.setSession()` 将 Token 存入 LocalStorage。
    *   用户状态变为 "已登录"。

---

## 5. 常见问题 (Troubleshooting)

| 现象 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| **Gallery 提示 "Auth session missing"** | Token 传递失败 | 检查 URL Hash 是否包含 `access_token`。 |
| **请求数据返回 404 Not Found** | **Account 暂未实现数据接口** | SSO 登录成功，但 Account 系统尚未实现 Gallery 所需的 PostgREST 接口。这是预期行为 (Phase 3 仅完成 SSO)。 |
| **跳转显示 "Unknown Application"** | Origin 未注册 | 检查 Account 数据库 `allowed_origins`。 |
| **VITE_SUPABASE_URL 连接失败** | 跨域或网络问题 | 确保 `VITE_SUPABASE_URL` 指向可访问的 Account 地址。 |
