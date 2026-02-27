# Backend Architecture (后端架构) - 规范篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🛡️ **Strict (严格执行)**
> **Stack**: Node.js 20 + Express

## 1. 编码规范
*   **模块**: 使用 ES Modules (`import/export`)。
*   **日志**: 必须使用 `middlewares/logger.js`。
*   **错误**: 使用集中式错误处理中间件。

## 2. 合规性
*   **Server 无逻辑**: `server.js` 代码行数必须 < 100 行。
*   **路由无逻辑**: 路由文件仅负责映射到控制器。
*   **版本**: 任何控制器变更 = `package.json` 版本号递增。
