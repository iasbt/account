# 修复日志（FIX_LOG）

> 用途：记录关键问题、根因与最终修复方案  
> 最新版本：1.9.17

## 2026-03-06 - 外部认证切换到 Logto（服务器端已部署）

### 1. 问题现象

- 已部署 Logto，但项目外部 OIDC 配置仍以通用变量或 Authentik 变量为主，接入与维护成本高。

### 2. 根因分析

- `config/index.js` 外部 OIDC 配置优先级未包含 Logto 专用变量，导致部署时需要额外映射。

### 3. 修复方案

1. 将外部 OIDC 读取优先级调整为：
   - `LOGTO_*`
   - `OIDC_EXTERNAL_*`
   - `AUTHENTIK_*`
2. 在 `.env.example` 增加 `LOGTO_ISSUER`、`LOGTO_JWKS_URL`、`LOGTO_AUDIENCE` 模板。

### 4. 验证结果

- 通过配置层验证：Logto 配置可直接生效，原有变量保持兼容。

### 5. 预防措施

- 后续外部 IdP 调整需先补齐 `.env.example` 与部署文档，再进行发布。

## 2026-03-06 - 管理后台鉴权失败（/api/admin/users 403）

### 1. 问题现象

- 管理员可登录页面但访问用户管理接口出现 403
- 部分管理员账号（非 `admin` 用户名）无法通过后台登录

### 2. 根因分析

- `authService` 在管理员登录流程中存在固定用户名前置判断
- 该逻辑使得真实管理员账号被提前拒绝，未进入统一权限判定

### 3. 修复方案

1. 删除固定用户名限制，统一以管理员身份事实判定：
   - `users.is_admin = true`
   - 或邮箱存在于 `admin_accounts`
2. 补充单元测试，覆盖“管理员非 admin 用户名”登录路径

### 4. 兼容性修复

- 在 `verifyAccessToken` 中增加 RS256 失败后的 HS256 兼容回退，保障历史签发 Token 平滑过渡。

### 5. 验证结果

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run test`：40/40 通过

### 6. 预防措施

- 新增缺陷时必须追加回归测试
- 鉴权逻辑不得再引入用户名硬编码路径
