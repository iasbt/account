# Account System (IAM / SSO)

统一账户中心，负责登录、权限控制与子应用单点登录回跳。

## 技术栈

- React + Vite + TypeScript
- React Router v7
- Zustand
- Supabase (Auth + Postgres)
- TailwindCSS

## 本地开发

```bash
npm install
npm run dev
```

## 环境变量

在项目根目录创建 `.env`：

```bash
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SSO_REDIRECT_ALLOWLIST=account.iasbt.com,localhost:5173
```

## 常用脚本

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run preview
```

## 结构要点

- 入口与自动排毒：[main.tsx](file:///C:/My_Project/account/src/main.tsx)
- 路由与权限入口：[App.tsx](file:///C:/My_Project/account/src/App.tsx)
- 认证状态中枢：[useAuthStore.ts](file:///C:/My_Project/account/src/store/useAuthStore.ts)
- 管理员守卫：[AdminGuard.tsx](file:///C:/My_Project/account/src/components/auth/AdminGuard.tsx)
- Supabase 客户端：[supabase.ts](file:///C:/My_Project/account/src/lib/supabase.ts)

## 权限与运维要点

- Admin 入口隐藏在 `/admin`
- 角色来源于 `public.profiles.role`
- 变更认证逻辑后需更新 `APP_VERSION` 触发自动排毒
- SSO 回跳链接格式为 `/login?redirect=https://target.app`
- 允许回跳的域名需在 `VITE_SSO_REDIRECT_ALLOWLIST` 中声明

## SSO 懒人接入手册

### 账号中心侧（Account）

1. 访问 `/admin -> Applications`，点击 Add Application 创建子应用
2. 创建完成后进入 Integration Wizard，复制 Quick Start、Login URL 与 AuthCallback 代码片段
3. 将子应用域名加入 `VITE_SSO_REDIRECT_ALLOWLIST`

### 子应用侧（最少三步）

1. 配置环境变量

```bash
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_ACCOUNT_URL=https://account.your-domain.com
```

2. 登录按钮跳转

```ts
const accountUrl = import.meta.env.VITE_ACCOUNT_URL
const loginUrl = new URL('/login', accountUrl)
loginUrl.searchParams.set('redirect', `${window.location.origin}/auth/callback`)
loginUrl.searchParams.set('redirect_origin', window.location.origin)
window.location.href = loginUrl.toString()
```

3. 添加回调页并挂载路由

```ts
<Route path="/auth/callback" element={<AuthCallback />} />
```

## 子应用配置手册

### 必选配置

- 回调地址必须为 `/auth/callback`
- 回跳地址必须通过 allowlist 白名单校验
- `redirect_origin` 必须是子应用自身域名

### 回调页最小实现

从 Applications 的 Integration Wizard 复制 `AuthCallback.tsx` 代码即可使用，无需额外依赖。

### 常见问题

- 回跳回到了 Account：检查 redirect 是否为绝对 URL，或设置 redirect_origin
- 回跳被拦截：确认子应用域名已加入 `VITE_SSO_REDIRECT_ALLOWLIST`

## 数据库要求

- profiles：id/email/role，role 决定管理权限
- applications：子应用清单与回跳配置
- user_app_access：访问审计记录

## 部署

使用 Vercel SPA rewrite 配置，见 [vercel.json](file:///C:/My_Project/account/vercel.json)
