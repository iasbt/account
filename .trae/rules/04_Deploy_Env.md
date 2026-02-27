# Deployment (部署) - 环境篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: ⚙️ **Automated (自动化)**
> **Tool**: `deploy_remote.ps1`

## 1. 环境配置
*   **DB_HOST**: `iasbt-postgres` (Docker 内部 DNS)。
*   **NODE_ENV**: `production`。
*   **机密**: 通过 Docker Env 或服务器端 `.env` 注入。

## 2. 故障排查
*   **版本不匹配**: 检查 `package.json` vs `server.js`。
*   **网络**: 确认 `correction_default` 网络是否存在。
