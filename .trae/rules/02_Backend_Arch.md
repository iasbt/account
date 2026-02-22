# Backend Architecture Standards (后端架构规范)

> **Status (状态)**: 🛡️ **Enforced (强制执行)**
> **Stack (技术栈)**: Node.js 20 + Express

## 1. Layered Architecture (分层架构) - Strict (严格)

*   **Entry (入口)**: `server.js` (仅负责 HTTP 服务启动)。
*   **App (应用)**: `app.js` (挂载中间件与路由)。
*   **Config (配置)**: `config/index.js` (环境变量集中管理)。
*   **Routes (路由)**: `routes/*.js` (端点定义)。
*   **Controllers (控制器)**: `controllers/*.js` (业务逻辑)。
*   **Middlewares (中间件)**: `middlewares/*.js` (切面逻辑)。
*   **Utils (工具)**: `utils/*.js` (辅助函数)。

## 2. Coding Rules (编码规范)
*   **Module (模块)**: 使用 ES Modules (`import/export`)。
*   **Logs (日志)**: 必须使用 `middlewares/logger.js`。
*   **Errors (错误)**: 使用集中式错误处理中间件。

## 3. Compliance (合规性)
*   **No Logic in Server**: `server.js` 代码行数必须 < 100 行。
*   **No Logic in Routes**: 路由文件仅负责映射到控制器。
*   **Version**: 任何控制器变更 = `package.json` 版本号递增。
