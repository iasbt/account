# API Specs (API 契约) - 基础篇

> **Status**: Active
> **Effective Date**: 2026-03-07
> **Enforcement**: 📝 **Stable (稳定)**
> **Prefix**: `/api`

## 1. 健康检查 (核心)
*   **GET** `/api/health`
*   **响应**: `{"status":"ok","service":"account-backend","version":"X.Y.Z"}`
*   **作用**: 部署脚本用于验证部署是否成功的核心依据。

## 2. 认证 (Deprecated)
*   **注意**: 本地认证已全面废弃，所有身份验证必须通过 Logto OIDC 进行。
*   **Token**: 所有受保护接口必须验证 Logto Access Token。
*   **详情**: 参见 `05_API_SSO_Config.md`。

## 3. 版本策略
*   **格式**: `Major.Minor.Patch` (如 1.8.1)。
*   **规则**: 后端逻辑变更必须触发 Patch 版本递增。
*   **基准**: 以 `package.json` 为唯一真理来源 (Source of Truth)。

## 4. 多环境 Origin 容错
*   **原则**: 必须同时兼容生产域名与裸 IP 访问。
*   **配置**: `CORS_ALLOWLIST` 必须包含 `https://account.iasbt.com` 与 `http://119.91.71.30`。
