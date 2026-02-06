# Account System - 核心开发与架构文档 (The Project Bible)

> **⚠️ 重要提示**：本文档是 Account 项目的“长期记忆”。任何接手此代码库的 AI 助手或开发者，在修改核心逻辑前**必须**阅读本文档，以了解架构约束、边缘情况处理及历史决策背景。

---

## 1. 项目身份 (Project Identity)
- **项目名称**: Account System (IAM / SSO Provider)
- **核心域名**: `account.iasbt.com`
- **项目目标**: 为 "Life OS" 生态系统提供中心化的身份认证、用户管理及应用分发服务。
- **项目性质**: SPA (单页应用) + Serverless Backend。

## 2. 技术栈 (Tech Stack)
- **前端框架**: React 18 + Vite
- **开发语言**: TypeScript
- **样式方案**: TailwindCSS
- **状态管理**: Zustand (集中式 Auth Store)
- **后端服务**: Supabase (Auth, PostgreSQL, Edge Functions)
- **部署平台**: Vercel (SPA 模式)
- **路由管理**: React Router v6

---

## 3. 核心架构与逻辑 (Core Architecture - DO NOT BREAK)

### 3.1 认证初始化引擎 (The "Parallel Turbo" Engine)
*文件位置: `src/store/useAuthStore.ts` -> `initialize`*

* **背景**: 原有串行逻辑（先查 Session 再查 Profile）导致冷启动耗时过长（>10秒），用户体验极差。
* **解决方案**: 实施了 **`Promise.all` 并行加载** 策略。
* **熔断机制 (Circuit Breaker)**:
    * 数据库查询被包裹在 **2000ms (2秒)** 的超时限制中。
    * **逻辑**: 如果数据库在 2 秒内未响应（如休眠或网络拥堵），系统将自动放弃查询，并赋予用户默认的 `role: 'user'` 权限，强制结束 Loading 状态。
    * **目的**: 防止“白屏死机”，保证用户至少能进入系统。

### 3.2 "核弹级" 退出机制 (The Nuclear SignOut)
*文件位置: `src/store/useAuthStore.ts` -> `signOut`*

* **背景**: 移动端浏览器（特别是 iOS Safari 和微信内置浏览器）对 JS 状态和 LocalStorage 有极强的缓存，导致用户点击退出后，再次登录会陷入“登录-退出”的死循环（Zombie State）。
* **解决方案**:
    1.  调用 Supabase `signOut()`。
    2.  清空 Zustand Store 状态。
    3.  **强制清理**: 执行 `localStorage.clear()` 和 `sessionStorage.clear()`。
    4.  **硬刷新 (Hard Reload)**: 使用 `window.location.href = '/login'` 代替路由跳转。这会强制浏览器重新加载整个页面，彻底清除内存中的旧变量。

### 3.3 自动排毒系统 (Auto-Detox / Version Control)
*文件位置: `src/main.tsx`*

* **机制**: 在应用挂载前检查 `APP_VERSION` 常量与 `localStorage` 中的版本号。
* **动作**:
    * 如果版本不匹配（例如发版更新了 Auth 逻辑），系统会自动执行“自毁程序”：清空所有缓存并强制刷新。
    * **目的**: 解决旧用户访问新版本时的缓存冲突（白屏/卡死）。

### 3.4 SSO 单点登录跳转流程
*文件位置: `src/features/auth/components/LoginForm.tsx`*

* **逻辑**:
    1.  检查 URL 参数 `?redirect=...`。
    2.  **有参数**: 登录成功后，使用 `window.location.href` 跳转至外部应用（如 Gallery）。
    3.  **无参数**: 使用 `Maps('/')` 跳转至 Account 内部首页。

### 3.5 管理员隐身模式 (Security by Obscurity)
* **UI 策略**: 前端移除了所有通向 Admin Console 的按钮和链接。
* **访问方式**: 仅能通过直接输入 URL `https://account.iasbt.com/admin` 访问。
* **权限守卫**: `AdminGuard.tsx` 会严格检查 `user.role === 'admin'`，权限不足会强制踢回首页。

---

## 4. 数据库设计 (Database Schema)

### 4.1 用户档案表 (`public.profiles`)
* **关联**: 通过 `id` 外键与 `auth.users` 表严格一对一绑定。
* **关键字段**:
    * `role`: `text` (枚举值: `'user'` | `'admin'`) —— **这是权限控制的核心**。
    * `email`: `text`
    * `avatar_url`: `text`
* **自动化 (Trigger)**:
    * 已配置 Postgres Trigger (`handle_new_user`)。
    * **作用**: 当用户在 Supabase Auth 注册成功时，自动在 `profiles` 表插入一行数据，并将 `role` 默认为 `'user'`。

### 4.2 访问审计表 (`public.user_app_access`)
* **用途**: 记录用户点击应用图标的行为。
* **RLS 策略**:
    * 允许用户 `INSERT` 自己的访问记录。
    * 允许用户 `SELECT` 自己的访问记录。

---

## 5. 部署配置 (Deployment Configuration)

### Vercel SPA 重写 (`vercel.json`)
*文件位置: 项目根目录*

* **问题**: React 是单页应用 (SPA)，只有一个 `index.html`。当用户直接访问 `/login` 或刷新页面时，Vercel 默认会找 `login.html`，找不到就报 404。
* **配置内容**:
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
* **作用**: 告诉 Vercel 将所有请求都导向 `index.html`，让 React Router 接管后续渲染。

---

## 6. 历史 Bug 修复记录 (The "Why We Did This" Log)

1.  **Bug: 登录后无限转圈，无报错**
    * **原因**: `initialize` 逻辑中未正确处理异常，导致 Promise 链断裂，loading 状态永远为 true。
    * **修复**: 全面引入 `try-finally` 结构，保证无论成功失败，`set({ loading: false })` 必执行。

2.  **Bug: 手机端退出后再次登录死循环**
    * **原因**: 移动端缓存导致旧 Token 残留，与新登录逻辑冲突。
    * **修复**: 实施方案 3.2（核弹级退出）和 3.3（自动排毒）。

3.  **Bug: 登录页点击登录后等待超过 10 秒**
    * **原因**: 串行查询（Session + Profile）加上数据库冷启动。
    * **修复**: 实施方案 3.1（并行初始化 + 2秒超时熔断）。

4.  **Bug: Gallery 应用报错 "Invalid schema: gallery"**
    * **原因**: 客户端 Supabase 初始化配置错误地指定了 `db: { schema: 'gallery' }`。
    * **修复**: 移除 schema 配置，默认使用 `public`。

---

## 7. 待办事项 (Future Roadmap)
- [ ] **头像同步**: 在 Account 修改头像后，自动同步到 `profiles` 表。
- [ ] **审计日志后台**: 在 Admin Console 中展示 `user_app_access` 数据。
- [ ] **跨域 Session 共享**: 研究如何让 Account 的登录态无缝传递给子应用（目前通过 redirect token 方案）。

---
*Last Updated: 2026-02-05*