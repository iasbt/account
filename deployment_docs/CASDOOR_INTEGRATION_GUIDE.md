# Casdoor 前端集成指南

本项目已集成 Casdoor 作为统一身份认证系统 (SSO)。

## 1. 配置文件
配置文件位于: `src/lib/casdoor.ts`

```typescript
import Sdk from "casdoor-js-sdk";

export const casdoorConfig = {
  serverUrl: "https://account.iasbt.cloud", // Casdoor 服务地址
  clientId: "YOUR_CLIENT_ID",               // [必需] 从 Casdoor 应用设置中获取
  organizationName: "built-in",             // Casdoor 组织名称
  appName: "app-built-in",                  // Casdoor 应用名称
  redirectPath: "/callback",                // 回调路径
};
```

## 2. 获取配置信息
1. 访问 `https://account.iasbt.cloud` (默认账号: admin / 123)
2. 进入 **Applications (应用)** 菜单。
3. 编辑 `app-built-in` (或者您新建的应用)。
4. 复制 `Client ID` 和 `Client Secret` (如果需要后端交互)。
5. 将 `Client ID` 填入 `src/lib/casdoor.ts`。

## 3. 回调处理
已创建 `src/pages/CasdoorCallbackPage.tsx` 处理 `/callback` 路由。
- 接收 `code` 参数。
- 交换 Access Token (目前代码演示了前端交换逻辑，生产环境建议通过 Backend API 代理)。
- 存储 Session 到 `useAuthStore`。

## 4. 下一步开发计划
1. 修改 `LoginForm.tsx`，添加 "使用 Casdoor 登录" 按钮，调用 `casdoorSdk.signin(casdoorConfig.serverUrl)`。
2. 更新 `useAuthStore.ts` 彻底移除 Supabase Auth 依赖，改为纯 JWT 管理。
3. 在 Casdoor 中配置 Redirect URL 为: `http://localhost:5173/callback` (开发环境) 和 `http://account.iasbt.cloud/callback` (生产环境)。

## 5. 常见问题
- **CORS 错误**: 确保 Casdoor 的 CORS 设置允许了您的前端域名。
- **登录循环**: 检查 `redirectPath` 是否配置正确。
