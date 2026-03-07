# API 文档（API Documentation）

> 文档版本：1.9.25  
> 最后更新：2026-03-07  
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
  "version": "1.9.24"
}
```

## 3. 认证接口

### 说明

- 统一认证仅使用 Logto（外部 OIDC）
- 本地注册/登录/重置密码接口已移除

### GET `/api/auth/me`

- 说明：校验当前 Token 并返回用户信息

## 4. 管理员接口

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

- 本地 OAuth/OIDC 已废弃，仅保留 Logto 端点
- `/api/oauth/*` 与 `/interaction/*` 返回 `410`
- `/.well-known/*` 重定向至 Logto

## 8. 错误码与错误语义

- `400`：参数错误 / 校验失败
- `401`：未认证或 Token 无效
- `403`：权限不足（如非管理员访问后台接口）
- `404`：资源不存在
- `429`：触发限流
- `500`：服务内部错误

## 9. 本次修复关联说明（1.9.25）

- 认证统一切换为 Logto
- 移除本地 OAuth/OIDC 与本地登录接口
