# Changelog

本文件记录项目的重要变更。

## [1.9.17] - 2026-03-06
### Changed
- **OIDC External Provider**: 外部 OIDC 配置新增 Logto 优先级，支持通过 `LOGTO_ISSUER`、`LOGTO_JWKS_URL`、`LOGTO_AUDIENCE` 直接接入服务器端 Logto。
- **Config Compatibility**: 保留 `OIDC_EXTERNAL_*` 与 `AUTHENTIK_*` 回退链路，确保已有部署配置不中断。

### Documentation
- **Env Template**: `.env.example` 增加 Logto 环境变量模板。
- **Deployment Docs**: `readme` 文档同步增加 Logto 接入与验收说明。

## [1.9.16] - 2026-03-06
### Fixed
- **Admin Auth**: 修复管理员登录硬编码用户名限制，管理员判定统一基于 `is_admin` 与 `admin_accounts`。
- **OIDC Verify**: RS256 验签失败时新增 HS256 历史 Token 兼容回退，降低升级切换期鉴权失败率。

### Tests
- **Regression**: 新增管理员非固定用户名登录回归测试。
- **Integration Stability**: 修复登录集成测试中的 OIDC AccessToken 落库 SQL mock 适配。

### Documentation
- **Delivery Docs**: 新增并维护 `readme/` 交付文档包（API/架构/部署/开发/运维/日志）。

## [1.9.0] - 2026-02-27
### Architecture (Major)
- **JWKS & RSA**: 从对称加密 (HS256) 迁移至非对称加密 (RS256) 进行 JWT 签名。
- **Refresh Token Rotation**: 实现了安全的刷新令牌轮换 (Refresh Token Rotation) 以替代 Redis 黑名单。
- **Discovery**: 新增 `/.well-known/openid-configuration` 和 `/.well-known/jwks.json` 端点以符合 OIDC 规范。
- **Security**: 移除了核心认证流程对 Redis 的依赖（令牌现在是无状态的，但可通过数据库撤销）。
- **API**: 更新 `/oauth/token` 以支持 `grant_type=refresh_token`。

## [1.8.18] - 2026-02-27
### Security (Critical)
- **SSO**: 修复了 `redirect_uri` 验证中的关键漏洞（原使用 `startsWith`，现改为严格相等匹配）。
- **PKCE**: 为 OAuth 2.0 授权码流程实现了 PKCE (Proof Key for Code Exchange)。
- **Implicit Flow**: 废弃并禁用了隐式流端点 (`/sso/issue`) 以防止令牌泄露。
- **Database**: 通过迁移 `004` 向 `oauth_codes` 表添加了 `code_challenge` 和 `code_challenge_method` 列。
- **API Specs**: 更新了 `05_API_Specs.md` 以反映新的安全要求。

## [1.8.17] - 2026-02-27
### Fixed
- **SSO Logout Loop**: 修复了从 Gallery 登出后立即通过 SSO 重新认证的无限循环问题。实现了专用的前端 `LogoutPage` 以在重定向前清除本地状态。
- **Security**: 更新了 `helmet` 配置以禁用 `Cross-Origin-Opener-Policy` (COOP)，解决了重定向期间的浏览器控制台警告。
- **Backend**: 修改了 `authController`，将登出请求重定向到前端登出路由 (`/logout`) 而不是直接返回目标应用，确保正确的会话清理。

## [1.8.16] - 2026-02-27
### Added
- **SSO**: Implemented OAuth 2.0 Authorization Code Flow (`/oauth/authorize`, `/oauth/token`) for secure token exchange.
- **Gallery Integration**: 实现了 Image Gallery 后端逻辑 (`/images`, `/categories`)，支持 CRUD 操作。
- **Database**: 新增 Gallery 相关数据表 (`images`, `categories`, `tags`) 与 OAuth 授权码表 (`oauth_codes`)。
- **Auth**: 增强 `verifyToken` 支持 App-specific Secret (通过 `aud` 字段识别应用 ID)，解决 Gallery 401 错误。
- **Admin**: 集成邮件模板管理 API (`/admin/email/templates`) 与统计接口 (`/admin/email/stats`)。
- **Nginx**: 配置 `/images`, `/categories`, `/user` 的反向代理规则，解决 404 错误。
- **Migration**: 新增 `npm run migrate:gallery` 与 `npm run migrate:oauth` 脚本。

## [1.8.15] - 2026-02-27
### Security
- **Randomness**: 使用 `crypto.randomInt()` 替换了不安全的 `Math.random()` 用于验证码生成。
- **Token Payload**: 修复了 JWT 载荷中缺失 `user.name` 的关键错误（此前错误引用了 `user.username`）。

## [1.8.14] - 2026-02-27
### Added
- **Logout Endpoint**: 新增 `GET/POST /auth/logout` 以支持 SSO 重定向和 JSON 响应。
- **Security**: 实现了 `isValidRedirectTarget` 工具以防止登出时的开放重定向漏洞。
- **Rate Limiting**: 对登出路由应用了全局认证速率限制。
- **Token Blacklist**: 引入了基于 Redis 的令牌黑名单，以便在登出时使令牌失效。
- **Security Headers**: 集成了 `helmet` 以提供安全的 HTTP 头，并优化了 CORS 配置。

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
