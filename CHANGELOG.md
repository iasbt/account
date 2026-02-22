# Changelog

All notable changes to this project will be documented in this file.

## [1.6.5] - 2026-02-22
### Fixed
- **TypeScript Reference**: 修复了 `App.tsx` 中 `AdminPanel` 组件的引用路径错误，解决了生产环境构建失败的问题 (Commit: `f46f1ce`).

## [1.6.4] - 2026-02-22
### Added
- **Admin Portal**: 新增独立管理员门户 (`/admin`)，实现与用户仪表盘的视觉和逻辑隔离。
- **RBAC**: 实现了前端 `RequireAdmin` 路由守卫与后端 `roleCheck` 中间件。
- **User Management**: 新增 `GET /api/admin/users` 接口，用于获取全量用户列表 (仅限管理员)。
- **Frontend**: 新增 `src/pages/AdminPanel.tsx` 页面组件。
### Changed
- **Login Flow**: 登录逻辑升级，自动根据用户角色 (`isAdmin`) 重定向至不同门户 (Admin -> `/admin`, User -> `/`)。

## [1.6.3] - 2026-02-22
### Fixed
- **Database Config**: 修正 `docker-compose.yml` 中的 `DB_NAME` 为 `postgres`，解决了连接默认数据库的权限问题。
- **CORS**: 优化了 `cors.js` 中 `CORS_ALLOWLIST` 的环境变量注入处理逻辑，增加了调试日志。

## [1.6.2] - 2026-02-22
### Fixed
- **CORS**: 修复了 `119.91.71.30` 访问时的 "Origin not allowed" 错误，增加了对 Origin 列表的去空格和去尾部斜杠处理。

## [1.6.1] - 2026-02-22
### Added
- **Auto Evolution Engine**: 激活 Rule 09 (自动演进引擎)，实现了规则库的自我驱动管理。

## [V1.6] - 2026-02-22 (Frozen/Sealed)

### 🚀 Major Changes
- **Architecture Finalized**: "四合院" Project Matrix (Account System as Core Base).
- **Automated Deployment**: New `deploy_remote.ps1` script with Git-based workflow (Local -> GitHub -> Tencent Cloud).
- **Infrastructure Alignment**: 
    - Consolidated containers to `account-frontend`, `account-backend`, `iasbt-postgres`.
    - Enforced single Docker network (`correction_default`).
    - Standardized deployment path: `/home/ubuntu/account/deploy/correction`.

### ✨ Added
- **Health Check**: `GET /api/health` endpoint for version verification.
- **Documentation**: Created `ACCOUNT_SYSTEM_DEV_DOC_V1.6.md` as the single source of truth.
- **Security**: Strict whitelist for running containers.

### 🗑️ Removed (Legacy Cleanup)
- **PostgREST**: Replaced with custom Node.js API logic.
- **Nginx Gateway**: Merged into `account-frontend`.
- **Postgres Business**: Removed redundant database instance.
- **Supabase/MySQL**: Fully migrated to self-hosted PostgreSQL.

## [Unreleased] - 2026-02-11

### Added
- **Docker Deployment**: Created `deploy/docker-compose.yml` for full stack deployment (Nginx, PostgREST, Postgres).
- **Deployment Script**: Added `deploy_to_remote.ps1` for automated "one-click" deployment to Tencent Cloud via SSH.

### Changed
- **Server Migration**: Migrated from Supabase (SaaS) to self-hosted architecture on Tencent Cloud (119.91.71.30).
- **Domain Strategy**:
    - 相册域名统一为 **`img.iasbt.com`**。
- **Deployment Logic**:
    - Updated `deploy_to_remote.ps1` to automatically clean up conflicting `nginx-proxy-manager` containers.
    - Hardcoded database password in deployment script to prevent data loss on redeployment.

### Fixed
- **Nginx Port Conflict**: Resolved "Bind for 0.0.0.0:443 failed" by removing legacy containers.

### Security
- **SSH Access**: Enforced key-based authentication (`trae.pem`) for server access.
- **Network Isolation**: Backend services are now isolated in internal Docker network, only accessible via Nginx.
