# Backend Architecture (后端架构) - 结构篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🛡️ **Strict (严格执行)**
> **Stack**: Node.js 20 + Express

## 1. 分层架构 (严格)

*   **入口**: `server.js` (仅负责 HTTP 服务启动)。
*   **应用**: `app.js` (挂载中间件与路由)。
*   **配置**: `config/index.js` (环境变量集中管理)。
*   **路由**: `routes/*.js` (端点定义)。
*   **控制器**: `controllers/*.js` (业务逻辑)。
*   **中间件**: `middlewares/*.js` (切面逻辑)。
*   **工具**: `utils/*.js` (辅助函数)。
