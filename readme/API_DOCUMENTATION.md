# API 文档（API Documentation）

> 文档版本：1.9.17  
> 最后更新：2026-03-06  
> 基础前缀：`/api`（除特别说明外）

## 1. 统一约定

- 认证方式：`Authorization: Bearer <token>`
- 响应格式：JSON
- 时间字段：ISO 8601
- 版本源：`package.json` 的 `version`

## 2. 健康检查

### GET `/api/health`

- 说明：部署与探活核心接口（后端原生入口为 `/health`，网关兼容 `/api/health`）
- 响应示例：

```json
{
  "status": "ok",
  "service": "account-backend",
  "version": "1.9.17"
}
```

## 3. 认证接口

### POST `/api/auth/register`

- 请求体：

```json
{
  "name": "alice",
  "email": "alice@example.com",
  "password": "Passw0rd!",
  "code": "123456"
}
```

### POST `/api/auth/login`

- 请求体：

```json
{
  "account": "alice@example.com",
  "password": "Passw0rd!"
}
```

- 成功响应示例：

```json
{
  "success": true,
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "alice",
    "email": "alice@example.com",
    "isAdmin": false
  }
}
```

### GET `/api/auth/me`

- 说明：校验当前 Token 并返回用户信息

## 4. 管理员接口

### POST `/api/admin/auth/login`

- 说明：管理员登录
- 管理员判定：
  - `users.is_admin = true`，或
  - 邮箱存在于 `admin_accounts` 表

### GET `/api/admin/users`

- 说明：获取用户列表
- 权限：`requireAuth` + `requireAdmin`

### PUT `/api/admin/users/:id`

- 说明：更新用户
- 权限：管理员

### DELETE `/api/admin/users/:id`

- 说明：删除用户
- 权限：管理员

## 5. 应用接入接口

### GET `/api/apps`
### POST `/api/apps`
### GET `/api/apps/:id`
### PUT `/api/apps/:id`
### POST `/api/apps/:id/rotate-secret`
### DELETE `/api/apps/:id`

- 说明：应用注册、配置更新、密钥轮换

## 6. 邮件管理接口

### GET `/api/admin/email/providers`
### POST `/api/admin/email/providers`
### POST `/api/admin/email/providers/:id/enable`
### GET `/api/admin/email/templates`
### PUT `/api/admin/email/templates/:type`
### GET `/api/admin/email/logs?page=1&limit=20`
### GET `/api/admin/email/stats`

## 7. OAuth/OIDC 接口

### GET `/api/oauth/authorize`

- 说明：浏览器授权入口（推荐），启动授权码流程并执行跳转

### POST `/api/oauth/authorize`

- 说明：服务端调用入口（兼容），用于以请求体方式提交授权参数

### POST `/api/oauth/token`

- 说明：授权码换 Token / Refresh Token 刷新

### GET `/.well-known/openid-configuration`
### GET `/.well-known/jwks.json`

- 说明：OIDC 发现与公钥分发

## 8. 错误码与错误语义

- `400`：参数错误 / 校验失败
- `401`：未认证或 Token 无效
- `403`：权限不足（如非管理员访问后台接口）
- `404`：资源不存在
- `429`：触发限流
- `500`：服务内部错误

## 9. 本次修复关联说明（1.9.17）

- 管理员登录不再依赖固定用户名 `admin`
- `admin_accounts` 邮箱绑定与 `is_admin` 标记均可通过管理员鉴权
- OIDC 验签链路支持 RS256 失败后的 HS256 兼容回退
- 外部 OIDC 可直接使用 Logto：`LOGTO_ISSUER`、`LOGTO_JWKS_URL`、`LOGTO_AUDIENCE`
