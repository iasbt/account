# Deployment & Operations (部署与运维)

> **Status (状态)**: ⚙️ **Automated (自动化)**
> **Tool (工具)**: `deploy_remote.ps1`

## 1. The Pipeline (流水线)
1.  **Local (本地)**: `git push` 提交代码。
2.  **Trigger (触发)**: 执行 `.\deploy_remote.ps1 "Msg"`。
3.  **Remote (远程)**: SSH -> `git pull` -> `docker-compose build` -> `up -d`。
4.  **Verify (验证)**: 检查 `/api/health` 返回值。

## 2. Directory Structure (目录结构 - Remote)
```text
/home/ubuntu/account/
├── deploy/
│   └── correction/ (Compose Root - 编排根目录)
│       ├── docker-compose.yml
│       ├── Dockerfile.api
│       └── nginx.conf
├── server.js
```

## 3. Environment Config (环境配置)
*   **DB_HOST**: `iasbt-postgres` (Docker 内部 DNS)。
*   **NODE_ENV**: `production`。
*   **Secrets (机密)**: 通过 Docker Env 或服务器端 `.env` 注入。

## 4. Troubleshooting (故障排查)
*   **Version mismatch (版本不匹配)**: 检查 `package.json` vs `server.js`。
*   **Network (网络)**: 确认 `correction_default` 网络是否存在。
