# Changelog

本文件记录项目的重要变更。

## [1.8.13] - 2026-02-26
### Critical
- **Auth Architecture Fix**: 修复了核心账号系统数据源错位问题，现在 `public.users` 是唯一真理来源。
- **Admin Access**: 修复了管理员权限丢失问题，强制同步了 `legacy_users` 的管理员状态到主表。
- **Dashboard**: 修正了仪表盘用户统计逻辑，现在准确反映活跃用户数（不再仅统计旧存档用户）。
- **User Management**: 重构了后台用户管理接口，支持对所有新老用户的增删改查。

## [1.8.12] - 2026-02-26
### Changed
- **SSO**: 移除 Supabase 兼容逻辑，统一使用标准 JWT 发放。
- **Apps**: 清理 `applications` 的 `token_type` 字段与前端配置入口。
- **Infra**: 删除 PostgREST 相关路由、代理与容器清理逻辑。
- **Docs**: 同步更新 OpenAPI、数据库附件与架构图，移除 Supabase 相关引用。

## [1.8.8] - 2026-02-26
### Fixed
- **SSO**: 修复了登录后无法自动跳转回子应用的问题。`LoginPage` 现在支持跨域跳转，并通过 Hash Fragment 传递 Token。
- **Domain**: 暂时移除 `img.iasbt.com` 域名配置，全面转向 IP 访问 (`119.91.71.30`) 以解决备案拦截问题。
- **Docs**: 更新了 Gallery 集成指南，移除了域名引用，强调使用 IP 地址。

## [1.8.7] - 2026-02-26
### Fixed
- **Dashboard**: 修复仪表盘统计数据异常问题，后端改用 `public.legacy_users` 表进行总用户数统计，前端优化了应用列表的动态加载。
- **Skills**: 将 `planning-with-files` 与 `uiuxpromax` 技能的输出语言强制配置为简体中文，并汉化了核心任务模板 (`task_plan.md`, `findings.md`, `progress.md`)。
- **Documentation**: 更新 `Gallery_Project_Integration_Guide_Final.md`，移除已废弃的外部依赖，明确 Account-First SSO 架构，并适配 IP 访问模式。

## [1.8.6] - 2026-02-25
### Security
- **Validation**: 引入 Zod Schema 对所有认证接口 (`/auth/*`) 进行严格的参数校验。
- **Rate Limiting**: 集成 `express-rate-limit` 防止暴力破解与短信轰炸 (全局 50次/15分, 验证码 3次/1分)。
- **XSS Protection**: 管理后台邮件模板预览引入 `DOMPurify`，彻底阻断 XSS 攻击路径。

### Architecture
- **Service Layer**: 重构认证模块，将 `authController` 中的业务逻辑剥离至 `authService`，实现关注点分离。
- **Database**: 完成从 `legacy_users` 到标准 `users` 表的迁移，统一使用 UUID (Text) 作为主键。
- **Cleanup**: 移除过时的内存验证码存储，全面转向 Redis 存储。

### Observability
- **Logging**: 集成 `winston` 日志库，实现结构化 JSON 日志输出，包含 `requestId` 全链路追踪。
- **Metrics**: 集成 `prom-client`，新增 `/metrics` 端点，暴露 HTTP 请求耗时与 Node.js 运行时指标。

### Documentation
- **API Specs**: 发布 OpenAPI 3.0 定义文件 `docs/openapi.yaml`，完整覆盖 Auth/Admin/Apps 接口。

### Tests
- **Coverage**: 新增 `tests/unit` 单元测试套件，覆盖 `token.js` 与 `helpers.js` 核心逻辑。
- **Fix**: 修复 `isOriginAllowed` 工具函数中对通配符域名的转义缺陷 (Found via tests)。

## [1.8.5] - 2026-02-25

### Enhanced
- **Email Service V2**: Added 24h trend chart to dashboard, visual template editor with variable insertion, and improved stats API.
- **Documentation**: Synchronized all project documentation (API Specs, README) with latest implementation.
- **File Management**: Reorganized `docs/` folder structure per Trae rules (Support/Archive).

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
- **Flexible Token Strategy**: 支持针对不同子应用生成不同格式的 Token (外部兼容 JWT / Standard JWT)。
- **Secret Isolation**: 支持为每个子应用配置独立的 `SSO_SECRET`，增强安全性。
- **Documentation**: 更新 `LOG/ACCOUNT_GALLERY_SSO_INTEGRATION_GUIDE.md` 至 V2.0。

## [1.7.8] - 2026-02-24
### Added
- **SSO Bridge**: 新增外部兼容的 SSO 认证流程。
    - 前端：新增 `/sso/issue` 页面，处理跳转逻辑。
    - 后端：新增外部兼容 JWT 的生成工具函数。
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
- **Legacy API**: Replaced with custom Node.js API logic.
- **Nginx Gateway**: Merged into `account-frontend`.
- **Postgres Business**: Removed redundant database instance.
- **外部 SaaS/MySQL**: Fully migrated to self-hosted PostgreSQL.

## [Unreleased] - 2026-02-11

### Added
- **Docker Deployment**: Created `deploy/docker-compose.yml` for full stack deployment (Nginx, Backend API, Postgres).
- **Deployment Script**: Added `deploy_to_remote.ps1` for automated "one-click" deployment to Tencent Cloud via SSH.

### Changed
- **Server Migration**: Migrated from external SaaS to self-hosted architecture on Tencent Cloud (119.91.71.30).
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
