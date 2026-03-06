# 开发日志（DEV_LOG）

> 用途：记录开发过程中的重要变更、优化措施与阶段性总结  
> 最新版本：1.9.17

## 2026-03-06T23:35:00+08:00 - v1.9.17 - 外部认证对接 - 优先接入服务器端 Logto

- 作者：Account Maintainer
- 评审人：待代码评审
- 开发目标：
  - 直接使用已部署的 Logto 作为外部 OIDC 提供方
  - 保持旧配置兼容，避免线上认证中断
- 关键实现：
  1. 外部 OIDC 配置优先级切换为 `LOGTO_*` -> `OIDC_EXTERNAL_*` -> `AUTHENTIK_*`。
  2. `.env.example` 新增 Logto 变量模板，便于部署时直接配置。
  3. 同步更新 readme 文档中的部署、架构、API 说明与变更记录。
- 修改文件清单：
  - `config/index.js`
  - `.env.example`
  - `package.json`
  - `CHANGELOG.md`
  - `readme/API_DOCUMENTATION.md`
  - `readme/ARCHITECTURE.md`
  - `readme/DEPLOYMENT.md`
  - `readme/CHANGELOG.md`
- 验证结果：
  - `npm run lint`：通过
  - `npm run typecheck`：通过
  - `npm run test`：40/40 通过
  - `npm run test:integration`：命令通过（当前用例为 skip）

## 2026-03-06T23:10:00+08:00 - v1.9.16 - 鉴权链路修复与文档治理

- 作者：Account Maintainer
- 评审人：待代码评审
- 开发目标：
  - 解决管理员登录依赖固定用户名导致的后台访问失败
  - 修复历史 Token 在 RS256 切换后的兼容验证问题
  - 建立 `readme/` 文档交付目录并补齐核心技术文档
- 关键实现：
  1. 认证服务移除固定 `admin` 用户名前置拦截，改为统一管理员判定。
  2. OIDC 验签增加 RS256 -> HS256 兼容回退，再回退 opaque token。
  3. 补充鉴权回归测试并修复集成测试中的 OIDC 落库 mock。
  4. 新增 `readme` 目录下 API、架构、部署、开发、运维、变更、修复日志文档。
- 修改文件清单：
  - `services/authService.js`
  - `services/oidcProvider.js`
  - `tests/unit/authService.test.js`
  - `src/lib/__tests__/auth-login.test.ts`
  - `package.json`
  - `readme/*.md`
- 验证结果：
  - `npm run lint`：通过
  - `npm run typecheck`：通过
  - `npm run test`：40/40 通过
  - `npm run test:integration`：命令通过（当前用例为 skip）
- 风险与后续：
  - 需要将 E2E 用例从 skip 提升为可执行并接入 CI
  - 需要补齐性能基准与压力测试自动化
