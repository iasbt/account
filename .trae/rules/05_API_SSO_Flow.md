# API Specs (API 契约) - SSO 流程

> **Status**: Active
> **Effective Date**: 2026-03-07
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 授权流程 (Authorization Flow)
*   **GET** `https://logto.iasbt.cloud/oidc/auth`: Logto 授权码流程。

## 2. 令牌交换 (Token Exchange)
*   **POST** `https://logto.iasbt.cloud/oidc/token`: Logto 令牌交换与刷新。

## 3. 说明
*   本项目不再提供本地 `/api/oauth/*` 与 `/interaction/*` 端点。
