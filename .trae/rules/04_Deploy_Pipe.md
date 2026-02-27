# Deployment (部署) - 流水线篇

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
