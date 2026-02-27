# API Specs (API 契约) - SSO 篇

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**

## 1. SSO 契约 (V1.9.0 Security Update)
*   **Discovery**: `/.well-known/openid-configuration` (OIDC 兼容)
*   **JWKS**: `/.well-known/jwks.json` (公钥分发)
*   **POST** `/api/oauth/authorize`: 启动授权流程 (Auth Code Flow)。
    *   Body: `{ client_id, redirect_uri, response_type='code', scope, state, code_challenge, code_challenge_method }`
    *   **PKCE**: 推荐使用 S256 Challenge。
    *   **Strict Match**: `redirect_uri` 必须与应用注册的 `allowed_origins` 完全一致。
*   **POST** `/api/oauth/token`: 换取/刷新 Access Token。
    *   Body (Exchange): `{ grant_type='authorization_code', code, redirect_uri, client_id, client_secret, code_verifier }`
    *   Body (Refresh): `{ grant_type='refresh_token', refresh_token, client_id, client_secret }`
    *   **PKCE**: 若 authorize 阶段使用了 PKCE，此处必须提供 `code_verifier`。
    *   **Rotation**: 每次刷新都会颁发新的 Refresh Token，旧 Token 立即作废。
