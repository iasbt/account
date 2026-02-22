# API Contract & Versioning (API 契约与版本控制)

> **Status**: Active
> **Effective Date**: 2026-02-22
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

## 4. 版本策略
*   **格式**: `Major.Minor.Patch` (如 1.6.1)。
*   **规则**: 后端逻辑变更必须触发 Patch 版本递增。
*   **基准**: 以 `package.json` 为唯一真理来源 (Source of Truth)。

## 5. 多环境 Origin 容错
*   **原则**: 必须同时兼容生产域名与裸 IP 访问。
*   **配置**: `CORS_ALLOWLIST` 必须包含 `https://account.iasbt.com` 与 `http://119.91.71.30`。
*   **原因**: 防止 DNS 解析延迟或调试期间的直接 IP 访问被 CORS 拦截。
