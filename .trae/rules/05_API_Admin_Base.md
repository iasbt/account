# API Specs (API 契约) - Admin 管理篇

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 管理员接口 (Admin APIs)
*   **权限**: 所有接口需携带 `Bearer Token` 且用户 `is_admin=true`。

### 1.1 用户管理
*   **GET** `/api/admin/users`: 获取用户列表。
*   **DELETE** `/api/admin/users/:id`: 删除用户。
*   **PUT** `/api/admin/users/:id`: 更新用户信息。

### 1.2 应用接入 (App Management) - V1.8.1
*   **GET** `/api/apps`: 获取所有已注册应用。
*   **POST** `/api/apps`: 注册新应用。
    *   Body: `{ name, app_id, allowed_origins, token_type, secret }`
*   **GET** `/api/apps/:id`: 获取特定应用详情。
*   **PUT** `/api/apps/:id`: 更新应用配置。
*   **POST** `/api/apps/:id/rotate-secret`: 重置应用密钥 (V1.8.6)。
    *   Response: `{ secret: "new_secret..." }`
*   **DELETE** `/api/apps/:id`: 删除应用 (软删除或物理删除取决于实现)。
