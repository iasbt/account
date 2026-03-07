# API Specs (API 契约) - SSO 配置与发现

> **Status**: Active
> **Effective Date**: 2026-03-07
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 核心配置 (Single Source of Truth)
所有应用（Web/Mobile/Service）必须严格使用以下配置，严禁使用多套系统或模式。

### 1.1 应用: image-gallery (SPA)
*   **App ID**: `ixfys7q24qqojz38547po`
*   **Endpoint**: `https://logto.iasbt.cloud/`
*   **Redirect URI**: `https://iasbt.cloud/callback`
*   **Post Logout Redirect URI**: `https://iasbt.cloud/`
*   **CORS Allowed Origins**: `https://iasbt.cloud`

### 1.2 令牌设置
*   **Refresh Token**: 启用轮换 (Rotation)。
*   **有效期**: 14 天。
*   **Always Issue**: 禁用 (仅在必要时颁发)。

## 2. 发现端点 (Discovery)
*   **Issuer**: `https://logto.iasbt.cloud/oidc`
*   **Discovery**: `https://logto.iasbt.cloud/oidc/.well-known/openid-configuration`
*   **JWKS URI**: `https://logto.iasbt.cloud/oidc/jwks`

## 3. 关键端点 (Endpoints)
*   **Authorization**: `https://logto.iasbt.cloud/oidc/auth`
*   **Token**: `https://logto.iasbt.cloud/oidc/token`
*   **UserInfo**: `https://logto.iasbt.cloud/oidc/me`
*   **End Session**: `https://logto.iasbt.cloud/oidc/session/end`

## 4. 安全说明
*   **Single Source**: 认证与授权只使用 Logto OIDC。
*   **Strict Match**: `redirect_uri` 必须与 Logto 控制台完全一致。
