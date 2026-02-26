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
*   `servers.json`

## 4.1 图库部署 (`deploy/gallery/`)
*   `Dockerfile`
*   `nginx.conf`
*   `deploy_gallery.ps1`

## 5. 自动化
*   `deploy_remote.ps1`

## 6. 文档 (`.trae/rules/`)
*   `00` to `09` (`.md`)
*   `AUDIT_REPORT_V1.6.md`

## 7. 技能 (`.trae/skills/`)
*   `uiuxpromax/` 下的 `SKILL.md`
*   `uiuxpromax/data/`
*   `uiuxpromax/scripts/`
*   `planning-with-files/` 下的 `SKILL.md`
*   `planning-with-files/examples.md`
*   `planning-with-files/reference.md`
*   `planning-with-files/templates/`
*   `planning-with-files/scripts/`
*   `ralph-loop/` 下的 `README.md`
*   `ralph-loop/LICENSE`
*   `ralph-loop/.claude-plugin/`
*   `ralph-loop/commands/`
*   `ralph-loop/hooks/`
*   `ralph-loop/scripts/`

## 8. 项目文档 (`docs/`)
*   `docs/`
