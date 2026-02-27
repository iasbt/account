# API Specs (API 契约) - SSO 发现

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 发现与密钥 (Discovery & Keys)
*   **Discovery**: `/.well-known/openid-configuration` (OIDC 兼容)
*   **JWKS**: `/.well-known/jwks.json` (公钥分发)

## 2. 安全说明 (V1.9.0)
*   **PKCE**: 推荐使用 S256 Challenge。
*   **Strict Match**: `redirect_uri` 必须与应用注册的 `allowed_origins` 完全一致。
