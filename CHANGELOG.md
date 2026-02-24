# Changelog

本文件记录项目的重要变更。

## [1.8.4] - 2026-02-25
### Added
- **Email Service V2**: 全新重构邮件服务模块，支持更稳定的邮件发送与管理。
    - **Infrastructure**: 引入 Redis + BullMQ 实现异步邮件队列，支持指数退避重试机制。
    - **Admin UI**: 全新的邮件服务中心 (`/admin` -> 邮件服务)，包含概览、配置、模板、日志四个标签页。
    - **Dynamic Config**: 支持在线配置 SMTP 服务商信息 (Host/Port/Auth)，不再依赖硬编码的环境变量。
    - **Templates**: 可视化邮件模板编辑器，支持变量替换与实时预览。
    - **Logs**: 完整的邮件发送日志记录，包含发送状态、错误信息与重试次数。
### Fixed
- **Auth**: 修复 `authController.js` 中因重复用户数据导致的“全部密码错误”问题，现在会自动遍历所有匹配记录。
- **CORS**: 修复 Admin 登录页面的 "Origin not allowed" 错误，将 `localhost:5174` 等端口加入白名单。
- **TypeScript**: 修复 `EmailTemplates.tsx` 与 `EmailManager.tsx` 中的类型定义错误与 Lint 警告。
- **Workspace**: 修复 `pnpm` workspace 警告，添加 `pnpm-workspace.yaml` 配置文件。

## [1.8.3] - 2026-02-25
### Fixed
- **Admin UI**: 修复前端管理员状态显示逻辑，现在能正确识别并显示 `is_admin` 字段。
- **Data Recovery**: 完成 `legacy_users` 与 `applications` 数据的全量导入与清洗，自动处理了 ID 冲突与脏数据。
- **Backend API**: `GET /api/admin/users` 接口现在显式返回 `is_admin` 字段。

## [1.8.2] - 2026-02-25
### Fixed
- **Admin Permission Logic**: 修复 `roleCheck.js` 中对 `req.user.tokenType` 的错误判断，修正为 `req.user.isAdmin`。
- **Server Crash**: 修复 `appController.js` 中引入未安装的 `uuid` 包导致服务启动失败的问题。
- **Data Integrity**: 重置超级管理员账号 (`admin`) 并清理其他非法管理员权限。

## [1.8.1] - 2026-02-24
### Added
- **Visual App Management**: 在管理员后台 (`/admin`) 新增“应用接入”模块，支持可视化管理 SSO 子应用。
    - **UI**: `AppManager` 组件支持查看、创建、编辑、删除应用。
    - **Features**: 自动生成 Secret、一键复制、多行域名输入。
- **Database Registry**: SSO 应用注册表从 `config/apps.js` 迁移至 PostgreSQL `applications` 表，实现动态配置。
- **Admin API**: 新增 `/api/apps` 系列接口 (CRUD)，由 `appController` 处理。
- **Security**: 
    - **Role Check**: 应用管理接口强制要求 `requireAdmin` 权限。
    - **Active Check**: SSO 认证流程增加 `is_active` 状态校验。

## [1.8.0] - 2026-02-24
### Added
- **Application Registry (V2.0)**: 引入 `config/apps.js` 注册表机制 (已在 v1.8.1 迁移至 DB)，支持多应用 (Gallery, Toolbox) 的动态 SSO 配置。
- **Flexible Token Strategy**: 支持针对不同子应用生成不同格式的 Token (Supabase JWT / Standard JWT)。
- **Secret Isolation**: 支持为每个子应用配置独立的 `SSO_SECRET`，增强安全性。
- **Documentation**: 更新 `LOG/ACCOUNT_GALLERY_SSO_INTEGRATION_GUIDE.md` 至 V2.0。

## [1.7.8] - 2026-02-24
### Added
- **SSO Bridge**: 新增 Supabase 兼容的 SSO 认证流程。
    - 前端：新增 `/sso/issue` 页面，处理跳转逻辑。
    - 后端：新增 `generateSupabaseToken` 工具函数，生成符合 Supabase 标准的 JWT。
    - 接口：`/api/sso/issue` 支持返回带有 Hash Fragment 的 URL。
- **Documentation**: 新增 `LOG/ACCOUNT_GALLERY_SSO_INTEGRATION_GUIDE.md`。

## [1.7.7] - 2026-02-24
### Added
- 增加 pgAdmin4 服务编排，提供 Web 数据库管理界面。
### Changed
- 部署脚本支持注入 PGADMIN_DEFAULT_EMAIL / PGADMIN_DEFAULT_PASSWORD 到远端 .env。
- 增加 pgAdmin 预配置服务器清单并挂载到容器。
- pgAdmin 启动时强制加载 servers.json。

## [1.7.5] - 2026-02-24
### Fixed
- 修复重置密码验证码校验未等待异步读取导致的误判问题。
- 找回密码页面改为真实发送验证码接口，并补充失败提示。
### Changed
- 前端重置密码流程统一通过 Store 调用服务，符合数据流规范。
- 清理未使用的管理员登录服务接口。
### Tests
- 更新管理员登录单测以匹配实际数据表与字段。

## [1.7.1] - 2026-02-23
### Infrastructure
- **Redis Integration**: Introduced Redis for robust verification code storage, replacing in-memory Map.
- **Docker**: Added `account-redis` container to the stack.

## [1.7.0] - 2026-02-23
### Added
- **Feature Completion**: 全面补全了开发文档中缺失的页面与功能，实现了系统的闭环。
    - **Legal Pages**: 新增 `TermsPage` (服务条款) 和 `PrivacyPage` (隐私政策)。
    - **Error Pages**: 新增 `NotFoundPage` (404)，提供友好的错误提示与返回指引。
    - **Account Recovery**: 新增 `ForgotPasswordPage` (找回密码) 页面。
- **Admin System V2**: 管理后台功能大幅增强。
    - **User Management**: 新增“删除用户”与“编辑用户”功能 (前端+后端 API)。
    - **Interactive UI**: 实现了删除确认弹窗与编辑表单弹窗。
- **Security**:
    - **Change Password**: 在个人中心新增修改密码功能，支持旧密码验证与新密码哈希存储。
    - **Backend API**: 新增 `DELETE /admin/users/:id`, `PUT /admin/users/:id`, `POST /auth/change-password` 接口。

### Optimized
- **UI/UX Refinement**:
    - **Layout Compactness**: 大幅收紧了登录页、注册页与管理后台的布局间距，消除了视觉上的松散感。
    - **Component Styling**: 统一了全站的输入框、按钮高度 (40px) 与字体大小 (15px)，提升精致度。

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
