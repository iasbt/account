# 部署手册（DEPLOYMENT）

> 文档版本：1.9.23  
> 最后更新：2026-03-07

## 1. 部署原则

- 原子流程：本地编辑 -> Git Push -> 远程拉取
- 严禁：直接在服务器修改代码
- 生产运行：仅 Docker 容器，禁止裸 Node.js

## 2. 关键目录与文件

- 远端编排根：`/home/ubuntu/account/deploy/correction/`
- 核心文件：
  - `docker-compose.yml`
  - `Dockerfile.api`
  - `Dockerfile.web`
  - `nginx.conf`

## 3. 生产服务与端口矩阵

- `account-backend`：`3000:3000`
- `account-frontend`：`80:80`
- `iasbt-postgres`：`5432:5432`
- `redis`：`6379:6379`
- `pgadmin`：`8888:80`
- `portainer`：`9000:9000`
- `logto-core`：`3001`（用户端容器端口）、`3002`（管理端容器端口）
- `logto-postgres`：仅内网访问，无公网映射

域名映射：

- `https://logto.iasbt.cloud` -> `logto-core:3001`
- `https://logto-console.iasbt.cloud` -> `logto-core:3002`
- `https://account.iasbt.cloud` -> `account-frontend` -> `account-backend`
- `https://iasbt.cloud` -> `account-frontend` -> `gallery-frontend`

## 4. 环境变量要求

- `NODE_ENV=production`
- `DB_HOST=iasbt-postgres`
- `CORS_ALLOWLIST` 需包含：
  - `https://account.iasbt.cloud`
  - `http://119.91.71.30`
- 外部认证（Logto）推荐配置：
  - `LOGTO_BASE_URL`（推荐）
  - `LOGTO_ISSUER`（可选）
  - `LOGTO_JWKS_URL`（可选）
  - `LOGTO_AUDIENCE`（可选，按 Logto Resource 配置）
- 说明：当仅设置 `LOGTO_BASE_URL` 时，系统会自动补齐 `/oidc` 与 `/oidc/jwks`
- 部署 SSH 私钥建议配置：`DEPLOY_KEY_PATH=C:\My_Project\account\yuanchengmiyao.pem`
- 机密信息仅通过服务器 `.env` 或 Docker Env 注入

## 5. 标准部署流程

1. 本地完成变更并通过质量门禁：
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
2. 执行部署脚本：

```powershell
.\deploy_remote.ps1 "release: v1.9.23"
```

3. 脚本自动执行：
   - `git add .` + `git commit` + `git push origin main`（有变更时自动提交）
   - `git fetch origin main` + `git reset --hard origin/main`
   - 同步 `.env` 到 `deploy/correction/.env` 并检查/生成持久化 RSA 密钥
   - `docker-compose build`
   - `docker-compose up -d`
   - 健康检查 `/health`（失败时回退 `/api/health`）
4. 校验版本号与 `package.json` 一致

## 6. 回滚方案

- 回滚触发条件：
  - `/health` 与 `/api/health` 均不通过
  - 版本号校验失败
  - 核心链路（登录/后台）不可用
- 回滚操作：
  1. 回退到上一个稳定提交
  2. 重新执行 `.\deploy_remote.ps1 "<rollback message>"`
  3. 重做健康检查与关键接口冒烟

## 7. 发布后核验清单

- 健康检查：`/health`（兼容 `/api/health`）
- 认证接口：`/api/auth/login`
- 管理后台：`/api/admin/auth/login`、`/api/admin/users`
- OIDC：`/.well-known/openid-configuration`、`/.well-known/jwks.json`
- Logto 用户端：`https://logto.iasbt.cloud/oidc/.well-known/openid-configuration`
- Logto 管理端：`https://logto-console.iasbt.cloud/`
- 监控：`/metrics`

## 8. 常见故障

- 版本不一致：优先检查 `package.json` 与健康接口返回
- 容器网络异常：确认 `correction_default` 网络存在
- 管理员鉴权失败：检查 `users.is_admin` 与 `admin_accounts` 数据一致性
- Logto 验签失败：检查 `LOGTO_ISSUER` 与 Token `iss` 是否完全一致，并验证 `LOGTO_JWKS_URL` 可访问
- Logto JWKS 缓存异常：确认 `logto.iasbt.cloud` 的 `/.well-known/openid-configuration` 与 `/oidc/jwks` 响应不被缓存
- SSH 密钥权限失败：优先使用 `C:\My_Project\account\yuanchengmiyao.pem` 并检查密钥文件可读权限
