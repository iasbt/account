# API Contract & Versioning (API 契约与版本控制)

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**
> **Prefix**: `/api`

## 1. 健康检查 (核心)
*   **GET** `/api/health`
*   **响应**: `{"status":"ok","service":"account-backend","version":"X.Y.Z"}`
*   **作用**: 部署脚本用于验证部署是否成功的核心依据。

## 2. 认证
*   **POST** `/api/auth/register`: `{name, email, password, code}`
*   **POST** `/api/auth/login`: `{account, password}` -> `{token, user}`
*   **GET** `/api/auth/me`: 验证 Token 有效性。

## 3. SSO 契约
*   **GET** `/api/auth/sso-token`: 返回一次性 Token。
*   **目标**: 外部应用通过回调验证此 Token。
*   **GET** `/api/sso/issue`: 根据 `target` URL 颁发 Access Token (Redirect 模式)。

## 4. 版本策略
*   **格式**: `Major.Minor.Patch` (如 1.8.1)。
*   **规则**: 后端逻辑变更必须触发 Patch 版本递增。
*   **基准**: 以 `package.json` 为唯一真理来源 (Source of Truth)。

## 5. 多环境 Origin 容错
*   **原则**: 必须同时兼容生产域名与裸 IP 访问。
*   **配置**: `CORS_ALLOWLIST` 必须包含 `https://account.iasbt.com` 与 `http://119.91.71.30`。
*   **原因**: 防止 DNS 解析延迟或调试期间的直接 IP 访问被 CORS 拦截。

## 6. 管理员接口 (Admin APIs)
*   **权限**: 所有接口需携带 `Bearer Token` 且用户 `is_admin=true`。

### 6.1 用户管理
*   **GET** `/api/admin/users`: 获取用户列表。
*   **DELETE** `/api/admin/users/:id`: 删除用户。
*   **PUT** `/api/admin/users/:id`: 更新用户信息。

### 6.2 应用接入 (App Management) - V1.8.1
*   **GET** `/api/apps`: 获取所有已注册应用。
*   **POST** `/api/apps`: 注册新应用。
    *   Body: `{ name, app_id, allowed_origins, token_type, secret }`
*   **GET** `/api/apps/:id`: 获取特定应用详情。
*   **PUT** `/api/apps/:id`: 更新应用配置。
*   **DELETE** `/api/apps/:id`: 删除应用 (软删除或物理删除取决于实现)。

### 6.3 邮件服务 (Email Service) - V1.8.4
*   **GET** `/api/admin/email/providers`: 获取所有邮件服务商配置。
*   **POST** `/api/admin/email/providers`: 创建新服务商。
*   **POST** `/api/admin/email/providers/:id/enable`: 启用指定服务商。
*   **GET** `/api/admin/email/templates`: 获取邮件模板列表。
*   **PUT** `/api/admin/email/templates/:type`: 更新特定类型模板。
    *   Body: `{ subject, content, variables }`
*   **GET** `/api/admin/email/logs`: 获取邮件发送日志。
    *   Query: `page`, `limit`
*   **GET** `/api/admin/email/stats`: 获取邮件发送统计 (含 24h 趋势)。
    *   Response: `{ total_sent, success_rate, trend: [{ hour, count }] }`
