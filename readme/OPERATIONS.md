# 运维手册（OPERATIONS）

> 文档版本：1.9.17  
> 最后更新：2026-03-07

## 1. 监控目标

- 接口可用性：`/api/health`、`/api/auth/login`、`/api/admin/users`
- 鉴权稳定性：401/403 比例与突增趋势
- Logto 认证稳定性：外部 Token 验签失败率、JWKS 拉取失败率
- 系统资源：CPU、内存、容器重启次数
- 数据库健康：连接数、慢查询、错误率

## 2. 指标与日志

- 指标端点：`/metrics`
- 日志中间件：`middlewares/logger.js`
- 结构化日志：统一记录请求 ID、状态码、耗时、错误栈
- 审计日志：关键鉴权与管理操作必须可追溯

## 3. 告警策略

- P0（立即）：健康检查失败、登录全量失败、管理员接口持续 5xx
- P1（高优）：认证错误率短时激增、容器频繁重启
- P2（常规）：单接口性能抖动、非核心接口错误升高
- P1（高优）：Logto `iss/jwks` 配置错误导致外部登录持续失败

## 4. 应急预案

1. 确认影响面（用户侧可见故障、后台管理故障、仅监控异常）
2. 快速止血（回滚稳定版本或降级非核心功能）
3. 保护数据（暂停高风险写操作，保留审计日志）
4. 根因定位（日志、指标、最近变更）
5. 复盘归档（FIX_LOG + DEV_LOG + CHANGELOG）

## 5. 日常运维清单

- 每日：检查健康接口与告警看板
- 每周：复盘错误日志 TopN、慢请求 TopN
- 每版本：核验部署脚本执行与版本一致性

## 6. 性能与容量治理

- 核心接口建立基准（P50/P95/P99）
- 发布前执行压力测试并记录吞吐量与资源曲线
- 当接口 SLA 低于阈值，阻断发布并进入优化流程

## 7. 生产服务与端口清单（统一管理）

- `account-backend`：`3000:3000`，业务 API 与鉴权核心
- `account-frontend`：`80:80`，Web 网关与静态资源
- `iasbt-postgres`：`5432:5432`，主业务数据库
- `redis`：`6379:6379`，缓存与队列基础设施
- `pgadmin`：`8888:80`，数据库可视化管理
- `portainer`：`9000:9000`，容器运维管理
- `logto-core`：`3001`（用户端，容器内），`3002`（管理端，容器内）
- `logto-postgres`：无公网端口，仅 Logto 内网访问

## 8. Logto 域名与端口映射策略

- 用户端域名：`https://logto.iasbt.cloud` -> Nginx -> `logto-core:3001`
- 管理端域名：`https://console.logto.iasbt.cloud` -> Nginx -> `logto-core:3002`
- OIDC 发现地址：`https://logto.iasbt.cloud/oidc/.well-known/openid-configuration`
- JWKS 地址：`https://logto.iasbt.cloud/oidc/jwks`
- 管理台首页：`https://console.logto.iasbt.cloud/`

## 9. Logto 404 快速排查

- 先检查反代：`nginx.conf` 中两个 `server_name` 是否为 `logto.iasbt.cloud` 与 `console.logto.iasbt.cloud`
- 再检查 Logto `.env`：`LOGTO_BASE_URL` 与 `LOGTO_ADMIN_URL` 是否与域名完全一致
- 再检查容器端口：`logto-core` 是否监听 `3001/3002`
- 再做本机探测：
  - `curl -H "Host: logto.iasbt.cloud" http://127.0.0.1/oidc/.well-known/openid-configuration`
  - `curl -H "Host: console.logto.iasbt.cloud" http://127.0.0.1/`
- 若仅访问用户域名根路径返回“未找到会话”，优先使用 OIDC 发现地址验证服务可用性
