# JWT 标准认证指南

> **版本**: V2.0
> **状态**: Active
> **适用范围**: 所有接入 Account 系统的客户端与服务端
> **更新日期**: 2026-02-26

## 1. 概述 (Overview)

Account 系统采用 **纯 JWT (JSON Web Token)** 机制进行身份认证。
本指南说明 Token 的生成规则、验证方法以及在 HTTP 请求中的使用规范。

**⚠️ 重要提示**: 旧版兼容 Supabase 的认证模式（Legacy Mode）已废弃，所有新开发功能必须遵循本指南。

## 2. Token 结构 (Token Structure)

系统颁发的 Token 符合 [RFC 7519](https://tools.ietf.org/html/rfc7519) 标准。

### 2.1 Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2.2 Payload (Claims)
Token 载荷包含用户的核心身份信息：

| 字段 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `sub` | **Subject**. 用户唯一 ID (UUID) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `name` | 用户名 | `"admin"` |
| `email` | 邮箱地址 | `"admin@iasbt.com"` |
| `isAdmin` | 是否为管理员 | `true` |
| `iss` | **Issuer**. 签发者 | `"account.iasbt.com"` |
| `aud` | **Audience**. 接收方 App ID | `"gallery"` (SSO) 或缺省 |
| `iat` | 签发时间 (Timestamp) | `1678886400` |
| `exp` | 过期时间 (Timestamp) | `1678890000` |

## 3. Token 使用 (Usage)

### 3.1 HTTP 请求头
所有受保护的 API 请求必须在 `Authorization` 头中携带 `access_token`：

```http
Authorization: Bearer <your_access_token>
```

### 3.2 验证 Token (服务端)
服务端接收到请求后，应使用 **共享密钥 (Secret)** 验证签名。

#### Node.js 示例 (`jsonwebtoken`)
```javascript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-app-secret';

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET, {
      algorithms: ['HS256'],
      issuer: 'account.iasbt.com'
    });
    return { valid: true, user: decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}
```

## 4. Token 生命周期 (Lifecycle)

*   **Access Token**: 有效期 **1 小时**。用于访问资源。
*   **Refresh Token**: 有效期 **7 天**。用于在 Access Token 过期后获取新 Token。

> **注意**: 目前 Refresh Token 机制主要在 SSO 流程中使用。标准 API 登录返回的 Token 默认有效期较长，未来将统一收缩。

## 5. 错误代码 (Error Codes)

| HTTP 状态码 | 错误信息 | 原因 |
| :--- | :--- | :--- |
| `401 Unauthorized` | `No token provided` | 请求头未携带 Token |
| `401 Unauthorized` | `jwt expired` | Token 已过期 |
| `403 Forbidden` | `invalid signature` | 签名验证失败（密钥错误或 Token 被篡改） |
