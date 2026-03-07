# 架构说明（ARCHITECTURE）

> 文档版本：1.9.25  
> 最后更新：2026-03-07

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

- 用户登录：Logto OIDC 授权码流程
- 管理员登录：`/api/admin/auth/login`
- Token 验签：`services/oidcProvider.js -> verifyAccessToken`

### 4.2 管理员判定

- 可信条件：
  - `users.is_admin = true`
  - 或邮箱存在于 `admin_accounts`
- 中间件：`requireAuth -> requireAdmin`

### 4.3 Token 验签策略

- 默认：外部 OIDC（Logto）验签
- 外部 IdP：按 `LOGTO_*` -> `OIDC_EXTERNAL_*` -> `AUTHENTIK_*` 顺序装配
- 兼容：仅对历史 Token 保留 HS256 过渡回退

## 5. 可观测性

- 日志：`middlewares/logger.js` + `utils/logger.js`
- 指标：`middlewares/metrics.js` + `/metrics`
- 审计：`services/auditLogger.js`

## 6. 部署架构

- 编排目录：`deploy/correction/`
- 容器：`account-backend`、`account-frontend`、`iasbt-postgres`、`portainer`
- 部署方式：`.\deploy_remote.ps1 "<message>"`
- 验证方式：`GET /health`（兼容 `/api/health`）且版本号匹配 `package.json`

## 7. 关键设计决策

- 保持 `server.js` 轻量，业务逻辑沉入 controller/service
- 管理员权限采用“字段 + 绑定表”双轨校验，避免单点数据不一致
- 认证以 Logto 为唯一来源，内建 OAuth/OIDC 端点默认关闭
- 外部 OIDC 接入采用统一优先级链路，Logto 为首选来源
- 文档同步规则作为合并前置门禁，防止代码与文档漂移
