# Deployment & Operations (部署与运维)

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: ⚙️ **Automated (自动化)**
> **Tool**: `deploy_remote.ps1`

## 1. 流水线
1.  **本地**: `git push` 提交代码。
2.  **触发**: 执行 `.\deploy_remote.ps1 "Msg"`。
3.  **远程**: SSH -> `git pull` -> `docker-compose build` -> `up -d`。
4.  **验证**: 检查 `/api/health` 返回值。

## 2. 目录结构 (Remote)
```text
/home/ubuntu/account/
├── deploy/
│   └── correction/ (编排根目录)
│       ├── docker-compose.yml
│       ├── Dockerfile.api
│       └── nginx.conf
├── server.js
```

## 3. 环境配置
*   **DB_HOST**: `iasbt-postgres` (Docker 内部 DNS)。
*   **NODE_ENV**: `production`。
*   **机密**: 通过 Docker Env 或服务器端 `.env` 注入。

## 4. 故障排查
*   **版本不匹配**: 检查 `package.json` vs `server.js`。
*   **网络**: 确认 `correction_default` 网络是否存在。
