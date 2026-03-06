# 架构说明（ARCHITECTURE）

> 文档版本：1.9.17  
> 最后更新：2026-03-06

## 1. 系统拓扑

- 网关层：Nginx（前端静态资源与 API 反向代理）
- 业务层：Node.js 20 + Express 5
- 数据层：PostgreSQL 14（唯一真理）
- 运维层：Portainer（容器运维）
- 网络：`correction_default`

## 2. 后端分层

- 入口：`server.js`（仅启动）
- 应用：`app.js`（中间件与路由装配）
- 路由：`routes/*.js`（仅路由映射）
- 控制器：`controllers/*.js`（业务编排）
- 服务：`services/*.js`（核心逻辑）
- 中间件：`middlewares/*.js`（鉴权、日志、限流、监控）
- 工具：`utils/*.js`（公共能力）

## 3. 前端分层

- 页面：`src/pages/`
- 状态：`src/store/`（Zustand）
- 服务：`src/services/`（统一 API 调用）
- 类型：`src/types/`
- 数据流：`Page -> Store -> Service -> ApiClient -> Backend`

## 4. 认证与授权链路

### 4.1 登录链路

- 用户登录：`/api/auth/login`
- 管理员登录：`/api/admin/auth/login`
- Token 发放：`services/oidcProvider.js -> issueAccessToken`

### 4.2 管理员判定

- 可信条件：
  - `users.is_admin = true`
  - 或邮箱存在于 `admin_accounts`
- 中间件：`requireAuth -> requireAdmin`

### 4.3 Token 验签策略

- 外部 IdP：优先按 Logto 配置（`LOGTO_ISSUER` + `LOGTO_JWKS_URL`）进行 JWKS 验签
- 首选：RS256（JWKS / 公钥验签）
- 兼容：RS256 失败后回退 HS256（历史 Token 兼容）
- 最后：尝试 OIDC opaque token 查找

## 5. 可观测性

- 日志：`middlewares/logger.js` + `utils/logger.js`
- 指标：`middlewares/metrics.js` + `/metrics`
- 审计：`services/auditLogger.js`

## 6. 部署架构

- 编排目录：`deploy/correction/`
- 容器：`account-backend`、`account-frontend`、`iasbt-postgres`、`portainer`
- 部署方式：`.\deploy_remote.ps1 "<message>"`
- 验证方式：`GET /api/health` 且版本号匹配 `package.json`

## 7. 关键设计决策

- 保持 `server.js` 轻量，业务逻辑沉入 controller/service
- 管理员权限采用“字段 + 绑定表”双轨校验，避免单点数据不一致
- OIDC 以标准协议为主，兼容路径仅用于历史平滑过渡
- 外部 OIDC 提供方默认优先 Logto，保留 Authentik/通用 OIDC 回退
- 文档同步规则作为合并前置门禁，防止代码与文档漂移
