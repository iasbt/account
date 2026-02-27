# API Specs (API 契约) - SSO 流程

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 授权流程 (Authorization Flow)
*   **POST** `/api/oauth/authorize`: 启动授权流程 (Auth Code Flow)。
    *   Body: `{ client_id, redirect_uri, response_type='code', scope, state, code_challenge, code_challenge_method }`

## 2. 令牌交换 (Token Exchange)
*   **POST** `/api/oauth/token`: 换取/刷新 Access Token。
    *   Exchange: `{ grant_type='authorization_code', code, redirect_uri, client_id, client_secret, code_verifier }`
    *   Refresh: `{ grant_type='refresh_token', refresh_token, client_id, client_secret }`
    *   **PKCE**: 若 authorize 阶段使用了 PKCE，此处必须提供 `code_verifier`。
    *   **Rotation**: 每次刷新都会颁发新的 Refresh Token，旧 Token 立即作废。
