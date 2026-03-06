# 变更日志（CHANGELOG）

## [1.9.17] - 2026-03-06

### 变更

- 外部 OIDC 配置支持并优先使用 Logto：
  - `LOGTO_ISSUER`
  - `LOGTO_JWKS_URL`
  - `LOGTO_AUDIENCE`
- 兼容保留 `OIDC_EXTERNAL_*` 与 `AUTHENTIK_*` 配置回退。

### 文档

- `.env.example` 已补充 Logto 环境变量模板。
- 部署与架构文档已补充 Logto 接入说明。

## [1.9.16] - 2026-03-06

### 修复

- 修复管理员登录硬编码限制：管理员登录不再要求用户名必须为 `admin`。
- 修复管理员鉴权链路：统一基于 `is_admin` 与 `admin_accounts` 进行管理员判定。
- 修复 OIDC 兼容问题：在 RS256 验签失败时兼容 HS256 历史 Token。

### 测试

- 新增管理员非固定用户名登录回归测试。
- 修复集成测试中 OIDC AccessToken 落库 SQL mock 适配，稳定测试输出。
- 全量执行并通过 `lint`、`typecheck`、`test`。

### 文档

- 新增并维护 `readme/` 文档体系：
  - `API_DOCUMENTATION.md`
  - `ARCHITECTURE.md`
  - `DEPLOYMENT.md`
  - `DEVELOPMENT_GUIDE.md`
  - `DEV_LOG.md`
  - `FIX_LOG.md`
  - `OPERATIONS.md`
