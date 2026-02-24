 # 图库项目登录与认证开发指南 (Gallery Auth Guide)

## 1. 背景与整体思路

- 身份中心：登录账号、密码、第三方登录（GitHub/Google/Microsoft 等）都不在图库项目中完成，而是在 Account 项目（统一账户中心）完成。
- 图库的角色：图库项目只负责：
  - 接收来自 Account 的认证结果（`access_token` / `refresh_token`）。
  - 在本地 Supabase 客户端中建立会话。
  - 基于会话控制路由访问（受保护页 / 公开页）、加载用户数据等。
- 登录入口策略：
  - 图库内部 `/signin` / `/signup` / `/login` / `/register` 全部直接跳转到 Account。
  - 未登录访问受保护路由时，自动跳转到 Account。
- 认证底座：所有登录状态依赖 Supabase：
  - 使用 `@supabase/supabase-js` 创建客户端。
  - `authStore` 使用 Supabase 的 `session/user` 驱动前端登录状态。
  - 所有数据读写通过 Supabase 表和 RLS 完成。

总结来说：图库是一个“受 Account 授权的子应用”，自己不处理核心认证，而是消费 Account + Supabase 提供的登录结果。

## 2. 关键模块总览

登录与认证相关核心文件：

- Supabase 客户端  
  - `src/lib/supabase.ts`
- 全局认证状态 Store  
  - `src/store/authStore.ts`
- 登录路由守卫  
  - `src/components/ProtectedRoute.tsx`
- 统一跳转 Account 的组件  
  - `src/components/AccountRedirect.tsx`
- Account 回调处理页面（设置 Supabase Session）  
  - `src/pages/AuthCallback.tsx`
- 路由配置（哪些路径需要登录）  
  - `src/router.tsx`
- 布局与“认证页面”识别  
  - `src/components/Layout.tsx`
- 登录/注册 UI 模板（当前未挂路由，可用于未来本地登录）  
  - `src/components/AuthPage.tsx`
- 认证环境变量与 DB 配置  
  - `src/config.ts`
  - `.env.example`

## 3. 端到端登录流程

### 3.1 未登录访问受保护页面时的流程

1. 用户访问受保护页面，例如 `https://gallery.example.com/upload`。
2. 路由在 `router.tsx` 中匹配到 `/upload`，该路径属于 `ProtectedRoute` 的子路由。
3. `ProtectedRoute` 从 `useAuthStore` 读取 `user` 和 `loading`：
   - `loading = true` 时显示“正在验证登录状态”的加载界面。
   - `loading = false` 且 `user = null` 时判定为未登录。
4. 当判定未登录时：
   - 从 `import.meta.env.VITE_ACCOUNT_URL` 读取 Account 地址。
   - 使用 `window.location.href = accountUrl` 重定向浏览器到 Account 登录页。
5. 用户在 Account 完成登录，由 Account 决定如何携带 token 回调图库项目。

### 3.2 从 Account 登录成功回到图库

假设 Account 登录成功后回跳地址为：

`https://gallery.example.com/auth/callback#access_token=...&refresh_token=...`

在图库项目中：

1. 路由 `/auth/callback` 命中 `AuthCallback.tsx`。
2. 组件在 `useEffect` 中执行回调处理：
   - 使用 `window.location.hash` 解析出 `access_token` 与 `refresh_token`。
   - 如果缺少任一 token，则通过 `window.location.href = accountUrl` 退回 Account。
3. token 存在时调用 `supabase.auth.setSession({ access_token, refresh_token })`：
   - 调用失败则退回 Account。
   - 调用成功后 `navigate('/', { replace: true })` 跳转到图库首页。
4. `setSession` 成功后，Supabase 会在本地存储中写入 session，后续 `authStore.initialize()` 会读取并填充 `user`。

### 3.3 全局 AuthStore 的职责

`src/store/authStore.ts` 使用 Zustand 维护认证状态：

- 状态字段：
  - `user: User | null`
  - `session: Session | null`
  - `loading: boolean`
  - `initializing: boolean`
  - `initialized: boolean`
  - `hasAcceptedTerms: boolean`
  - `hasSeenOnboarding: boolean`
- 核心方法：
  - `initialize()`：初始化 Supabase 会话、处理超时、监听状态变化。
  - `checkConsentStatus()`：从 `DB_SCHEMA.users` 读取条款/引导状态，并同步偏好设置。
  - `signIn(email, password)` / `signUp(email, password, name)`：通过 Supabase Auth 完成本地登录注册（当前路由未使用）。
  - `signOut()`：清理本地 session，调用 Supabase `signOut`，并清除 `localStorage` 中的 Supabase 相关键。

`initialize()` 的关键点：

- 使用 `Promise.race` 为 `supabase.auth.getSession()` 加超时防止初始化挂死。
- 遇到 refresh token 错误时执行本地登出和存储清理。
- 首次加载和后续状态变化时调用 `checkConsentStatus()`，保持用户条款状态与偏好同步。

## 4. 路由与页面角色

### 4.1 路由层（router.tsx）

`src/router.tsx` 中对认证相关路由的约定：

- `/signin` `/signup` `/login` `/register`：
  - 对应组件都是 `AccountRedirect`，即直接跳转到 `VITE_ACCOUNT_URL`。
- `/auth/callback`：
  - 对应组件 `AuthCallback`，负责解析 token 并设置 Supabase session。
- 受保护路由：
  - `settings/*`、`upload`、`favorites`、`timeline`、`map` 等均挂在 `ProtectedRoute` 下，只在 user 存在时渲染。

### 4.2 布局层（Layout.tsx）

`Layout` 中通过当前路径判断是否为认证相关页面：

- 使用路径前缀判断：`/signin`、`/signup`、`/login`、`/register`、`/auth/callback`。
- 在认证页面上隐藏 `Header` 与引导组件，只展示最简洁的内容。
- 非认证页面且 `user` 存在时展示 `Header` 与 `OnboardingTour`。

## 5. 环境变量配置

参考 `.env.example`：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SCHEMA=gallery
VITE_ACCOUNT_URL=https://account.iasbt.com
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
VITE_IMAGEKIT_URL_ENDPOINT=your_imagekit_endpoint
VITE_R2_WORKER_URL=your_r2_worker_url
VITE_R2_TOKEN=your_r2_token
VITE_DEV_EMAIL=dev@example.com
VITE_DEV_PASSWORD=password
```

与登录相关的关键项：

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`：必须与 Supabase 项目配置一致。
- `VITE_SUPABASE_SCHEMA`：默认为 `gallery`，决定访问的 schema。
- `VITE_ACCOUNT_URL`：Account 登录入口地址，所有登录重定向都会跳向这里。

本地开发最小步骤：

1. 复制 `.env.example` 为 `.env.local` 或 `.env`。
2. 填写 Supabase 与 Account 地址。
3. 在 Supabase / Account 中配置回调地址，例如 `http://localhost:5173/auth/callback`。
4. 运行图库项目（如 `npm run dev`），访问任意受保护页即会跳转到 Account 登录。

## 6. 常见开发场景

### 6.1 在图库中手动触发登录

两种典型方式：

- 直接跳到 Account：
  - 在按钮点击时执行 `window.location.href = import.meta.env.VITE_ACCOUNT_URL`。
- 通过内部路由再转到 Account：
  - 链接到 `/signin`，由 `AccountRedirect` 组件统一跳转到 Account。

### 6.2 在图库中实现退出登录

使用 `authStore` 中的 `signOut()`：

1. 调用 `signOut()` 清理 Supabase session 与本地缓存。
2. 如需统一登录体验，可在退出后重定向到 `VITE_ACCOUNT_URL`，让用户返回 Account 登录页。

### 6.3 将来启用本地登录（可选方案）

当前已有 `AuthPage` 组件提供登录/注册 UI，包括服务条款勾选和第三方登录按钮。若未来要在图库内部直接登录，可以：

1. 在 `router.tsx` 中为 `/signin` 等路径挂载使用 `AuthPage` 的页面，而不是 `AccountRedirect`。
2. 在该页面内使用 `authStore.signIn` 和 `authStore.signUp` 调用 Supabase Auth。
3. 登录成功后导航到受保护页面（如 `/` 或 `/timeline`）。

出于架构一致性考虑，在当前阶段仍推荐统一通过 Account 登录。

## 7. 开发时需要牢记的关键点

1. 图库不直接处理账号密码登录，统一依赖 Account。
2. 所有登录入口应引导到 `VITE_ACCOUNT_URL`（包括显式的 `/signin` 和隐式的未登录重定向）。
3. `/auth/callback` 是接收登录结果并设置 Supabase session 的唯一入口，不要随意更改回调结构。
4. 所有需要登录访问的页面必须挂在 `ProtectedRoute` 下。
5. 环境变量需要与 Supabase 与 Account 配置保持一致，避免 token 无法使用。
6. 退出登录时要同时考虑清理 Supabase session，并视需要返回 Account 登录页。

