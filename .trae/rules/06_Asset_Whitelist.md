# Sealed Asset Whitelist (封板资产白名单 V1.6)

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Policy**: 任何未在此列表中出现的文件均为 "Wild (野文件)"。

## 1. 核心配置
*   `package.json`, `tsconfig.json`, `vite.config.ts`
*   `.env.example`
*   `tailwind.config.js`, `postcss.config.js`

## 2. 后端模块
*   `server.js`, `app.js`
*   `config/`, `controllers/`, `middlewares/`, `routes/`, `utils/`

## 3. 前端源码
*   `src/main.tsx`, `src/App.tsx`, `src/index.css`
*   `src/pages/`, `src/services/`, `src/store/`, `src/types/`, `src/lib/`

## 4. 部署设施 (`deploy/correction/`)
*   `docker-compose.yml`
*   `Dockerfile.api`, `Dockerfile.web`
*   `nginx.conf`
*   `clean_house.sh`

## 5. 自动化
*   `deploy_remote.ps1`

## 6. 文档 (`.trae/rules/`)
*   `00` to `09` (`.md`)
*   `AUDIT_REPORT_V1.6.md`
