# Unified Account System - 用户手册 (v2.0)

> **版本**: 2.0 (Rebuilt with Casdoor)
> **最后更新**: 2026-02-11
> **核心特性**: 纯净前端、Casdoor SSO 集成、极简架构

---

## 📖 1. 项目简介

**Unified Account** 是一个基于 **React** 和 **Casdoor** 构建的统一身份认证门户。它摒弃了复杂的后端依赖（如 Supabase），采用纯前端架构，通过 OAuth 2.0 协议直接与 Casdoor 身份认证中心交互。

### 主要功能
- **统一登录 (SSO)**: 一键跳转 Casdoor 认证中心，支持账号密码、验证码等多种登录方式。
- **应用启动台**: 集中展示并快速访问所有已集成的服务（如 MT Photos 相册、个人中心等）。
- **用户状态管理**: 自动同步 Casdoor 用户头像、昵称，支持持久化登录状态。
- **无缝注销**: 支持从门户端发起全局注销，保障账户安全。

---

## 🚀 2. 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装与运行

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问: `http://localhost:5173`

3. **构建生产版本**
   ```bash
   npm run build
   ```

---

## ⚙️ 3. 配置说明

项目核心配置文件位于 `src/lib/casdoor.ts`。如需修改认证中心地址或 Client ID，请直接编辑此文件。

```typescript
// src/lib/casdoor.ts
export const casdoorConfig = {
  // Casdoor 服务器地址 (当前使用临时 IP 绕过备案)
  serverUrl: "http://119.91.71.30:8080", 
  
  // 应用 Client ID (必须与 Casdoor 后台一致)
  clientId: "2e31f2f0cac3e22dc501", 
  
  // 组织名称 (通常为 built-in)
  organizationName: "built-in",
  
  // 应用名称
  appName: "app-built-in", 
  
  // 登录回调地址 (路由必须匹配)
  redirectPath: "/callback", 
};
```

---

## 🛠️ 4. 架构与目录结构

本项目采用扁平化的架构设计，拒绝过度封装（"拒绝屎山代码"）。

```
src/
├── lib/
│   ├── casdoor.ts        # Casdoor 配置中心
│   └── utils.ts          # 通用工具函数 (如 Tailwind 类合并)
├── pages/                # 核心页面 (业务逻辑集中地)
│   ├── LoginPage.tsx     # 登录页 (入口)
│   ├── DashboardPage.tsx # 仪表盘 (主页、应用列表)
│   └── CasdoorCallbackPage.tsx # SSO 回调处理页
├── store/
│   └── useAuthStore.ts   # 全局状态管理 (Zustand)
├── App.tsx               # 路由配置与守卫
└── main.tsx              # 应用入口
```

### 关键逻辑说明

1.  **登录流程**:
    *   用户点击 `LoginPage` 中的登录按钮 -> `useAuthStore.login()` -> 跳转 `casdoorSdk.getSigninUrl()`。
2.  **回调处理**:
    *   Casdoor 重定向回 `/callback?code=xxx` -> `CasdoorCallbackPage` 捕获 `code` -> 调用 `useAuthStore.handleCallback(code)`。
    *   **handleCallback**: 内部执行 `fetch` 换取 Token -> `fetch` 获取用户信息 -> 更新 Store -> 跳转首页。
3.  **应用跳转**:
    *   `DashboardPage` 内置应用列表 (`APPS` 常量)，点击直接打开新标签页。

---

## 🔌 5. 添加新应用

要向仪表盘添加新的应用入口，无需修改复杂配置，只需编辑 `src/pages/DashboardPage.tsx`：

```typescript
// 找到 APPS 数组
const APPS: App[] = [
  {
    id: 'gallery',
    name: '相册图库',
    // ...
  },
  // 在这里添加新对象
  {
    id: 'new-app',
    name: '新应用名称',
    description: '应用描述',
    icon: <YourIconComponent />, // 使用 Lucide 图标
    url: 'http://your-app-url.com'
  }
]
```

---

## ❓ 6. 常见问题 (FAQ)

### Q1: 为什么页面图片显示不出来？
**A**: 我们已移除了不稳定的外部图片链接，改用 `lucide-react` 矢量图标。如果您需要自定义图片，请确保图片服务器允许跨域，或将图片放入 `public/` 目录并使用相对路径引用。

### Q2: 为什么控制台报错 `net::ERR_BLOCKED_BY_ORB`？
**A**: 这是浏览器安全策略拦截了跨域图片资源。新版本已通过替换为本地图标彻底解决了此问题。

### Q3: 修改了代码后登录没反应？
**A**: 请检查 `src/lib/casdoor.ts` 中的 `clientId` 是否正确，以及 Casdoor 后台配置的回调地址是否包含 `http://localhost:5173/callback`。

### Q4: 如何部署到服务器？
**A**: 
1. 运行 `npm run build` 生成 `dist/` 目录。
2. 使用 Nginx 或任何静态文件服务器托管 `dist/` 目录。
3. 确保服务器防火墙开放了相应端口。

---

## 📝 7. 开发日志 (最新)

- **v2.0.0 (2026-02-11)**: 
  - 重构核心架构，移除 Supabase 及所有冗余代码。
  - 修复 Casdoor 登录回调逻辑，解决重复请求问题。
  - 优化 UI，采用深色主题 + 矢量图标。
  - 解决 ORB 跨域图片拦截问题。

---

*Powered by IASBT Cloud Team*
