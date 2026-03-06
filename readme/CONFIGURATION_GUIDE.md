# 配置总册（CONFIGURATION_GUIDE）

> 文档版本：1.9.17  
> 最后更新：2026-03-07  
> 适用范围：Account 项目本地开发、测试、部署、运维、故障排查  
> 阅读对象：新接手工程师、开发工程师、运维工程师、发布负责人

## 1. 文档目标与阅读方式

这份文档是本项目的“配置单一事实来源（Single Source of Truth）”。你可以把它理解为一张“配置地图”：  

- 先说明“配置从哪里来”  
- 再说明“每类配置影响什么行为”  
- 再说明“不同环境应该如何填值”  
- 最后给出“上线前检查”和“故障时定位路径”  

如果你是第一次接手，建议按下面顺序阅读：

1. 先读第 2 章（配置分层与优先级），建立全局认知。  
2. 再读第 3～6 章，分别掌握后端、前端、部署、Logto。  
3. 实操时直接用第 7 章的环境模板与第 8 章检查清单。  
4. 出现故障时按第 9 章排障手册逐项核对。  

本项目所有核心配置都围绕四件事展开：  
数据库可连接、鉴权可验证、跨域可放行、部署可回滚。只要这四件事稳定，系统就稳定。

---

## 2. 配置分层与优先级模型

### 2.1 配置来源分层

项目配置按影响范围分为五层，自上而下覆盖：

1. **运行时环境变量（最高优先级）**  
   例如容器 `environment`、服务器 `.env`、平台注入变量。  
2. **应用默认值（代码内 fallback）**  
   例如 `config/index.js` 中 `process.env.X || defaultValue`。  
3. **部署脚本动态注入值**  
   例如 `deploy_remote.ps1` 在远端自动写入 `CORS_ALLOWLIST`。  
4. **开发工具默认值**  
   例如 `vite.config.ts` 中本地代理默认 `http://localhost:3000`。  
5. **文档模板示例值（最低优先级）**  
   例如 `.env.example` 仅用于示例，不代表生产最终值。  

### 2.2 三条必须记住的优先级规则

- **规则 A：运行时优先于模板。**  
  你在 `.env.example` 看到的值，不会自动进入生产环境。生产以容器/服务器真实注入值为准。  
- **规则 B：后端 `config/index.js` 是行为准入层。**  
  变量虽然在环境里存在，但如果代码没读取，就等于没配置。  
- **规则 C：发布脚本会改写部分变量。**  
  某些值（如 CORS）可能在部署时被自动替换，排障必须同时看脚本逻辑和容器实值。  

### 2.3 为什么要坚持这个模型

很多线上故障本质上不是“代码 bug”，而是“配置漂移”：  
同名变量在本地、CI、服务器含义不一致，或者脚本覆盖了预期值。  
本章的目标是把“配置漂移”问题前置消灭，让任何人都能按同一套路定位问题。

---

## 3. 后端配置总览（Node.js + Express）

后端核心配置入口是 `config/index.js`，它定义了服务端口、JWT/OIDC、Redis、SMTP、跨域、调试等关键行为。  

### 3.1 服务基础配置

- `PORT`：服务监听端口，默认 3000。  
- `LOG_LEVEL`：日志等级，默认 `info`。  
- `NODE_ENV`：运行环境。生产环境下，若缺失关键密钥会触发硬失败。  

**关键约束**：  
生产环境缺少 `SSO_JWT_SECRET` 会直接抛错并阻止启动，这是故意设计，用于防止“无密钥启动”。

### 3.2 鉴权与 OIDC 配置

后端同时支持内部 OIDC 能力和外部 OIDC 验签接入，相关变量如下：

- 内部签发相关  
  - `OIDC_ISSUER`  
  - `OIDC_INTERNAL_CLIENT_ID`  
  - `OIDC_INTERNAL_REDIRECT_URI`  
  - `OIDC_ACCESS_TOKEN_TTL`  
  - `OIDC_AUTH_CODE_TTL`  
  - `OIDC_REFRESH_TOKEN_TTL`  
  - `OIDC_COOKIE_KEYS`  
- 外部验签相关  
  - `LOGTO_ISSUER`  
  - `LOGTO_JWKS_URL`  
  - `LOGTO_AUDIENCE`  
  - `OIDC_EXTERNAL_ISSUER`  
  - `OIDC_EXTERNAL_JWKS_URL`  
  - `OIDC_EXTERNAL_AUDIENCE`  
  - `AUTHENTIK_ISSUER`  
  - `AUTHENTIK_JWKS_URL`  
  - `AUTHENTIK_AUDIENCE`  

**当前已落地优先级（非常关键）**：  
外部 OIDC 配置读取顺序为：

1. `LOGTO_*`  
2. `OIDC_EXTERNAL_*`  
3. `AUTHENTIK_*`

这意味着你已经在服务器部署了 Logto 的情况下，只要填 `LOGTO_ISSUER` 和 `LOGTO_JWKS_URL`，后端会优先用 Logto 完成外部 Token 验签。

### 3.3 跨域与重定向配置

- `CORS_ALLOWLIST`：跨域白名单，多个域名用逗号分隔。  
- `CORS_ORIGIN`：旧字段兼容入口（当 `CORS_ALLOWLIST` 缺失时回退）。  
- `SSO_REDIRECT_ALLOWLIST`：重定向白名单（当前已声明为 deprecated，建议走应用配置管理）。  

**跨域排障原则**：  
先看请求来源（Origin），再看容器内真实 `CORS_ALLOWLIST`，最后看部署脚本是否改写了该字段。

### 3.4 数据与消息基础设施配置

- PostgreSQL  
  - `DB_HOST`（生产推荐：`iasbt-postgres`）  
  - `DB_PORT`（默认 5432）  
  - `DB_USER`  
  - `DB_PASSWORD`  
  - `DB_NAME`  
- Redis  
  - `REDIS_HOST`（默认 `redis`）  
  - `REDIS_PORT`（默认 6379）  
  - `REDIS_PASSWORD`（可选）  
- SMTP  
  - `SMTP_HOST`  
  - `SMTP_PORT`  
  - `SMTP_USER`  
  - `SMTP_PASS`  

### 3.5 调试与域名策略

- `DEBUG_ALLOWLIST`：允许调试输出的来源列表。  
- `ALLOWED_DOMAINS`：允许的域名后缀集合，默认包含 `.iasbt.com`、`localhost`、`127.0.0.1`。  

此部分常用于应急排查与安全策略微调，任何变更都应先在测试环境验证。

---

## 4. 前端配置总览（React + Vite + Zustand）

前端配置主要分三层：构建层（Vite）、API 层（ApiClient）、状态持久层（localStorage store）。

### 4.1 Vite 配置与代理

开发环境代理关键项：

- `VITE_AUTH_PROXY_TARGET`：本地 `/api` 代理目标。  
  - 缺省回退为 `http://localhost:3000`。  
- 本地 dev 端口固定为 `5174`。  

这意味着前端本地开发时，不需要在页面里写后端完整域名，只要请求 `/api`，Vite 会按该目标转发。

### 4.2 API 基础地址配置

`src/services/apiClient.ts` 的基地址读取：

- 优先 `import.meta.env.VITE_AUTH_BASE_URL`  
- 回退 `/api`

生产环境中如果由 Nginx 同域反代，`/api` 是最稳妥方案；若前后端分域部署，再按需指定 `VITE_AUTH_BASE_URL`。

### 4.3 Token 存储读取策略

客户端会尝试从多个持久化 key 恢复 token（如 `admin-auth-storage`、`auth-storage`），避免刷新后丢失登录态。  
如果遇到“页面显示未登录但接口仍带 token”的情况，通常是本地存储存在历史脏数据，需要清理后重测。

### 4.4 前端配置常见误区

- 误把后端容器内地址填到浏览器环境（例如 `http://account-backend:3000`）。  
  浏览器无法解析容器内 DNS，必须使用可访问域名或同域 `/api`。  
- 在页面组件里直接拼接配置值发请求。  
  项目规范要求走 `services/*.ts`，避免页面层散落配置逻辑。  

---

## 5. 部署与发布配置（Docker + PowerShell）

部署配置分为编排层和脚本层，两者缺一不可。

### 5.1 编排层：`deploy/correction/docker-compose.yml`

核心服务：

- `account-backend`：后端服务容器  
- `account-frontend`：Nginx + 前端静态资源  
- `redis`：缓存与队列基础设施  
- `pgadmin`：数据库可视化管理  

当前生产服务与端口（统一口径）：

- `account-backend`：`3000:3000`  
- `account-frontend`：`80:80`  
- `iasbt-postgres`：`5432:5432`  
- `redis`：`6379:6379`  
- `pgadmin`：`8888:80`  
- `portainer`：`9000:9000`  
- `logto-core`：容器 `3001/3002`（通过域名反代，不直接公网暴露）  
- `logto-postgres`：仅内网访问  

关键网络：

- `correction_default`（外部网络，项目主网络）  
- `logto-isolated`（Logto 相关网络）

关键挂载：

- `./certs:/app/certs`：持久化 RSA 密钥  
- `./nginx.conf:/etc/nginx/conf.d/default.conf`：前端网关配置  

### 5.2 脚本层：`deploy_remote.ps1`

脚本职责不是“简单执行 docker”，而是完整发布流水线编排：

1. 读取本地 `package.json` 版本作为发布目标。  
2. 本地提交并推送到远端仓库。  
3. 远端拉取并强制对齐 `origin/main`。  
4. 更新远端 `.env` 中的关键配置（如 CORS、pgAdmin）。  
5. 同步 `.env` 到部署目录。  
6. 检查/生成持久化 RSA 密钥。  
7. 启动或更新容器。  
8. 通过 `/health` 或 `/api/health` 做版本校验。  
9. 失败时输出后端日志，阻断发布。  

### 5.3 部署脚本配置来源：`scripts/load_env.ps1`

该脚本集中管理 PowerShell 发布变量，典型变量包括：

- `DEPLOY_SERVER_IP`  
- `DEPLOY_USER`  
- `DEPLOY_KEY_PATH`  
- `REMOTE_APP_DIR`（默认 `/home/ubuntu/account`）  
- `CORS_ALLOWLIST`（默认内置值）  

推荐将 `DEPLOY_KEY_PATH` 固定为：`C:\My_Project\account\yuanchengmiyao.pem`，避免历史密钥权限异常导致的 `Permission denied`。

**注意**：  
脚本层变量与应用层变量不是同一层概念。前者用于“怎么发布”，后者用于“服务怎么运行”。排障时不要混淆。

### 5.4 发布一致性原则

- 后端逻辑变更必须与版本号一致。  
- `/api/health` 返回版本必须与 `package.json` 对齐。  
- 发布成功定义为：容器正常 + 健康检查通过 + 关键接口冒烟通过。  

---

## 6. Logto 专章（外部认证优先接入）

既然你已在服务器部署 Logto，这一章是最关键的落地说明。

### 6.1 Account 侧需要的最小配置

在 Account 服务环境中至少提供：

- `LOGTO_ISSUER`：Logto 签发者地址（必须与 token `iss` 完全一致）  
- `LOGTO_JWKS_URL`：Logto JWKS 公钥地址  
- `LOGTO_AUDIENCE`：可选，建议与 Logto Resource Indicator 对齐  

域名与端口映射固定为：

- `https://logto.iasbt.cloud` -> `logto-core:3001`（用户端）  
- `https://logto-console.iasbt.cloud` -> `logto-core:3002`（管理端）  
- `https://logto.iasbt.cloud/oidc/.well-known/openid-configuration` 用于发现文档探活  

### 6.2 Logto 侧建议核对项

- 租户 Issuer 与 `LOGTO_ISSUER` 完全一致（包括协议、域名、尾部路径）。  
- 对应应用是否启用并允许目标回调地址。  
- JWKS 地址可从 Account 服务器网络连通（DNS + TLS 均正常）。  
- 若使用 audience 校验，token 的 `aud` 必须匹配 `LOGTO_AUDIENCE`。  

### 6.3 典型错误与含义

- `invalid signature`：多数是 `LOGTO_JWKS_URL` 错或拿到了旧 key。  
- `issuer mismatch`：`LOGTO_ISSUER` 与 token `iss` 不一致。  
- `audience invalid`：配置了 `LOGTO_AUDIENCE`，但 token `aud` 不匹配。  
- 间歇性失败：通常是网络抖动或 JWKS 缓存更新时序问题。  
- 用户域名根路径 404：通常是直接访问用户端入口导致，优先访问 OIDC 发现地址或发起标准授权流程。  

### 6.4 切换策略建议

如果你从其他外部 OIDC 迁移到 Logto，建议分两步：

1. 先在环境中同时保留旧变量与 Logto 变量，确认服务优先命中 Logto。  
2. 稳定运行一段周期后，再清理旧变量，避免“无回退通道”。  

---

## 7. 可直接使用的环境模板

以下模板仅用于说明结构，敏感值请在服务器安全注入，不要提交真实密钥。

### 7.1 本地开发模板（示例）

```ini
PORT=3000
LOG_LEVEL=debug
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=please_change_me
DB_NAME=postgres

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

SSO_JWT_SECRET=dev_secret_do_not_use_in_prod
OIDC_ISSUER=http://localhost:3000
OIDC_INTERNAL_CLIENT_ID=account-web
OIDC_INTERNAL_REDIRECT_URI=http://localhost:5174
OIDC_ACCESS_TOKEN_TTL=900
OIDC_AUTH_CODE_TTL=60
OIDC_REFRESH_TOKEN_TTL=1209600
OIDC_COOKIE_KEYS=dev_secret_do_not_use_in_prod

LOGTO_ISSUER=
LOGTO_JWKS_URL=
LOGTO_AUDIENCE=

CORS_ALLOWLIST=http://localhost:5174,http://127.0.0.1:5174
VITE_AUTH_BASE_URL=/api
VITE_AUTH_PROXY_TARGET=http://localhost:3000
```

### 7.2 生产部署模板（示例）

```ini
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

DB_HOST=iasbt-postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<server_secret>
DB_NAME=postgres

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<server_secret_optional>

SSO_JWT_SECRET=<server_secret_long_random>
OIDC_ISSUER=https://account.iasbt.cloud
OIDC_INTERNAL_CLIENT_ID=account-web
OIDC_INTERNAL_REDIRECT_URI=https://account.iasbt.cloud
OIDC_ACCESS_TOKEN_TTL=900
OIDC_AUTH_CODE_TTL=60
OIDC_REFRESH_TOKEN_TTL=1209600
OIDC_COOKIE_KEYS=<server_secret_long_random>

LOGTO_ISSUER=https://<your-logto-issuer>
LOGTO_JWKS_URL=https://<your-logto-issuer>/oidc/jwks
LOGTO_AUDIENCE=<optional_resource_indicator>

CORS_ALLOWLIST=https://account.iasbt.cloud,http://119.91.71.30
SMTP_HOST=<smtp_host>
SMTP_PORT=465
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_secret>
```

---

## 8. 发布前后配置检查清单

### 8.1 发布前（必检）

- `package.json` 版本是否符合发布目标。  
- 服务器密钥是否齐全（DB、SSO、SMTP、Logto）。  
- `CORS_ALLOWLIST` 是否覆盖生产域名与必要调试域名。  
- `LOGTO_ISSUER` 与真实 `iss` 是否一字不差。  
- 本地质量门禁是否已通过（lint、typecheck、test）。  

### 8.2 发布后（必检）

- `GET /api/health` 是否返回 `status=ok` 且版本一致。  
- 登录链路与管理员链路是否可用。  
- 外部 token 验签是否正常（Logto 场景）。  
- `/metrics` 与日志是否出现异常突增。  
- 若异常，能否按回滚流程快速恢复。  

### 8.3 交付物归档建议

每次配置变更至少归档：

- 变更内容（改了哪些变量、改动原因）  
- 影响范围（哪些服务、哪些接口）  
- 验证结果（命令、截图或日志摘要）  
- 回滚策略（如何 5 分钟内退回稳定状态）  

---

## 9. 故障排查手册（按症状定位）

### 9.1 登录失败（401 / 403）

先看三件事：

1. 请求是否带 `Authorization: Bearer`。  
2. Account 服务是否正确读取到外部 OIDC 配置。  
3. token 的 `iss/aud` 是否与配置一致。  

若是管理员接口失败，再补查：

- 用户是否具有管理员标识（`is_admin` 或管理账户映射）。  
- 管理端 token 与用户端 token 是否混用。  

### 9.2 跨域失败（CORS 报错）

定位顺序：

1. 浏览器报错中的 Origin 是什么。  
2. 容器中 `CORS_ALLOWLIST` 实值是否含该 Origin。  
3. 部署脚本是否在发布时覆盖了 CORS。  

很多“明明配置过但不生效”就是第 3 步导致的。

### 9.3 部署成功但版本没更新

优先核对：

- `package.json` 本地版本  
- 部署脚本目标分支与 `git reset --hard origin/main` 是否命中预期提交  
- 健康接口返回版本是否一致  

若版本不一致但容器重启成功，通常是远端没拉到你预期的提交，或镜像缓存命中旧层。

### 9.4 Logto 验签间歇性失败

常见原因：

- 网络到 JWKS 地址偶发不可达  
- Logto 轮换 key 后缓存未及时刷新  
- 反向代理层对外部地址做了不一致处理  

建议动作：

- 在服务器直接 `curl` JWKS 地址验证连通性。  
- 检查同时间段错误日志是否集中出现。  
- 对比失败 token 与成功 token 的头部 `kid` 是否一致。  

---

## 10. 新接手工程师快速上手路径

如果你是“今天第一次接手”，可以直接照这个路径执行：

1. 拷贝 `.env.example` 生成本地 `.env`，补齐数据库与密钥。  
2. 启动后端与前端，确认本地登录链路通。  
3. 明确生产使用 Logto，先在测试环境填好 `LOGTO_*` 并验签。  
4. 运行质量门禁（lint、typecheck、test）。  
5. 阅读部署脚本，确认远端目录、账号、密钥路径。  
6. 按标准命令执行部署并做健康检查。  
7. 对照本手册第 8 章清单完成发布后核验。  
8. 如有异常按第 9 章排查并把结论写入运维/修复日志。  

只要严格按这个流程，你不需要记忆所有历史细节，也可以稳定完成配置变更、部署与回滚。

---

## 11. 维护约定

为保证“后来者可无缝接手”，本文件维护遵循以下约定：

- 新增配置项：必须在本文件追加“用途 + 默认值 + 风险 + 示例”。  
- 调整优先级：必须显式记录变更前后顺序。  
- 发布脚本改动：必须同步更新本文件部署章节。  
- 认证链路改动：必须同步更新 Logto 章节与排障章节。  
- 每次更新后，至少执行一次 lint/typecheck/test，确保文档变更未引入工程副作用。  

本文件定位为“实操总册”，不是概念介绍。你在任何配置问题上遇到不确定性，应优先回到本文件逐章核对，而不是依赖口头记忆。

