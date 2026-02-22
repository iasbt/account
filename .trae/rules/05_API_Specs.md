# API Contract & Versioning (API 契约与版本控制)

> **Status (状态)**: 📝 **Stable (稳定)**
> **Prefix (前缀)**: `/api`

## 1. Health Check (健康检查 - Critical)
*   **GET** `/api/health`
*   **Response (响应)**: `{"status":"ok","service":"account-backend","version":"X.Y.Z"}`
*   **Role (作用)**: 部署脚本用于验证部署是否成功的核心依据。

## 2. Authentication (认证)
*   **POST** `/api/auth/register`: `{name, email, password, code}`
*   **POST** `/api/auth/login`: `{account, password}` -> `{token, user}`
*   **GET** `/api/auth/me`: 验证 Token 有效性。

## 3. SSO Contract (SSO 契约)
*   **GET** `/api/auth/sso-token`: 返回一次性 Token。
*   **Target (目标)**: 外部应用通过回调验证此 Token。

## 4. Versioning Policy (版本策略)
*   **Format (格式)**: `Major.Minor.Patch` (如 1.6.1)。
*   **Rule (规则)**: 后端逻辑变更必须触发 Patch 版本递增。
*   **Ref (基准)**: 以 `package.json` 为唯一真理来源 (Source of Truth)。
