# Backend Architecture Standards (后端架构规范)

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

## 2. 编码规范
*   **模块**: 使用 ES Modules (`import/export`)。
*   **日志**: 必须使用 `middlewares/logger.js`。
*   **错误**: 使用集中式错误处理中间件。

## 3. 合规性
*   **Server 无逻辑**: `server.js` 代码行数必须 < 100 行。
*   **路由无逻辑**: 路由文件仅负责映射到控制器。
*   **版本**: 任何控制器变更 = `package.json` 版本号递增。
