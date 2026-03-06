# JWT 标准认证指南

> **版本 (Version)**: V2.1
> **状态 (Status)**: Active
> **适用范围 (Scope)**: 所有接入 Account 系统的客户端与服务端
> **更新日期 (Date)**: 2026-03-07

## 1. 概述 (Overview)

Account 系统采用 **RS256 签名 (非对称加密)** 的 JWT (JSON Web Token) 机制进行身份认证。
本指南说明 Token 的生成规则、基于 JWKS 的验证方法以及在 HTTP 请求中的使用规范。

**⚠️ 重要提示**: 
1.  V2.1 主链路默认使用 `RS256`；服务端仅为历史存量 Token 保留 `RS256 -> HS256 -> opaque` 兼容回退。
2.  客户端与接入方应按 `RS256 + /.well-known/jwks.json` 进行标准验签，不应依赖 `JWT_SECRET`。

## 2. Token 结构 (Token Structure)

系统颁发的 Token 符合 [RFC 7519](https://tools.ietf.org/html/rfc7519) 标准。

### 2.1 Header

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id-from-jwks"
}
```

*   **alg**: 固定为 `RS256` (RSA Signature with SHA-256)。
*   **kid**: 密钥 ID，用于在 JWKS 中查找对应的公钥。

### 2.2 Payload (Claims)

Token 载荷包含用户的核心身份信息：

| 字段 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `sub` | **Subject**. 用户唯一 ID (UUID) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `name` | 用户名 | `"admin"` |
| `email` | 邮箱地址 | `"admin@iasbt.cloud"` |
| `isAdmin` | 管理员标识 | `true` 或 `false` |
| `iss` | **Issuer**. 签发者 | `"https://account.iasbt.cloud"` |
| `aud` | **Audience**. 接收方 App ID | `"gallery"` |
| `scope` | 授权范围 | `"profile"` |
| `iat` | 签发时间 (Timestamp) | `1678886400` |
| `exp` | 过期时间 (Timestamp) | `1678887300` (15分钟后，示例) |

## 3. Token 使用 (Usage)

### 3.1 HTTP 请求头

所有受保护的 API 请求必须在 `Authorization` 头中携带 `access_token`：

```http
Authorization: Bearer <your_access_token>
```

### 3.2 验证 Token (服务端)

服务端接收到请求后，应从 Account 系统的 JWKS 端点获取公钥进行验证。

*   **JWKS Endpoint**: `https://account.iasbt.cloud/.well-known/jwks.json`
*   **开发环境**: `http://localhost:3000/.well-known/jwks.json`

#### Node.js 示例 (`jwks-rsa` + `jsonwebtoken`)

```javascript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'http://localhost:3000/.well-known/jwks.json', // 生产环境请替换域名
  requestHeaders: {}, // 可选
  timeout: 30000 // 30s
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      algorithms: ['RS256'],
      issuer: 'https://account.iasbt.cloud' // 必须严格匹配 iss
    }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}
```

## 4. Token 生命周期与刷新 (Lifecycle & Rotation)

### 4.1 有效期
*   **Access Token**: 短效，默认 **15 分钟**（由 `SSO_TOKEN_TTL` 控制）。
*   **Refresh Token**: 长效，当前实现默认 **14 天**。

### 4.2 刷新令牌轮换 (Rotation Strategy)
为了防止 Refresh Token 被盗用，系统实施了**轮换策略**：
1.  客户端使用 `refresh_token_A` 换取新的 Access Token。
2.  服务器验证通过后，颁发新的 `access_token` 和 **新的** `refresh_token_B`。
3.  旧的 `refresh_token_A` **立即失效**。
4.  **安全语义**: 如果系统检测到已失效或被撤销的旧 Token 再次使用，将返回 `invalid_grant`，并按审计/告警链路记录风险事件。

### 4.3 刷新接口
*   **Endpoint**: `POST /api/oauth/token`
*   **Grant Type**: `refresh_token`

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "your_current_refresh_token",
  "client_id": "gallery",
  "client_secret": "your_client_secret" // 仅后端应用需要
}
```

## 5. 错误代码 (Error Codes)

| HTTP 状态码 | 错误信息 | 原因 |
| :--- | :--- | :--- |
| `401 Unauthorized` | `No token provided` | 请求头未携带 Token |
| `401 Unauthorized` | `jwt expired` | Token 已过期，请使用 Refresh Token 刷新 |
| `403 Forbidden` | `invalid signature` | 签名验证失败（密钥不匹配或 Token 被篡改） |
| `400 Bad Request` | `invalid_grant` | Refresh Token 无效、过期或已被复用（触发安全机制） |
