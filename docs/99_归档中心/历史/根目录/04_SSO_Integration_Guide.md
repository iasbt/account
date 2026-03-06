# 图库 (Gallery) 接入 Account SSO 适配指南

> **版本**: V1.0  
> **适用**: Gallery 项目 (前端 React + 后端 Node.js/Go 等)  
> **目标**: 适配 Account V1.9.2+ 的 OAuth 2.0 强制 PKCE 流程。

> **归档声明**: 本文档已不再使用，仅保留历史方案与排障线索。

---

## 1. 核心变更说明

Account 系统已升级安全策略，**彻底废弃**了不安全的“隐式流 (Implicit Flow)”（即直接通过 URL `#access_token=...` 返回 Token）。

**新流程 (Authorization Code Flow with PKCE)**:
1.  **Gallery**: 生成 PKCE 随机串 (`code_verifier`) 和摘要 (`code_challenge`)。
2.  **Gallery**: 跳转到 Account 授权页 (`/api/oauth/authorize`)。
3.  **Account**: 验证通过，重定向回 Gallery 并附带 `code`。
4.  **Gallery**: 后端（或前端）使用 `code` + `code_verifier` 换取 `access_token`。

---

## 2. 详细接入步骤 (Gallery 端修改)

### 第一步：安装依赖 (如果是前端项目)

你需要一个库来生成 PKCE 挑战码（也可以手写，但推荐用库）。

```bash
npm install crypto-js
```

### 第二步：生成 PKCE (前端/发起方)

在跳转登录前，生成 `code_verifier` 和 `code_challenge`，并将 `verifier` 存入 `localStorage` 或 `sessionStorage`（稍后换 Token 用）。

```javascript
// utils/pkce.js
import CryptoJS from 'crypto-js';

function base64URLEncode(str) {
    return str.toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function sha256(plain) {
    return CryptoJS.SHA256(plain);
}

export function generatePKCE() {
    // 1. 生成随机字符串 (Verifier)
    const verifier = base64URLEncode(CryptoJS.lib.WordArray.random(32));
    
    // 2. 生成摘要 (Challenge)
    const challenge = base64URLEncode(sha256(verifier));
    
    return { verifier, challenge };
}
```

### 第三步：发起授权跳转 (Login 按钮)

修改你的“使用 Account 登录”按钮逻辑：

```javascript
// pages/LoginPage.jsx
import { generatePKCE } from '../utils/pkce';

const handleLogin = () => {
    const { verifier, challenge } = generatePKCE();
    
    // !!! 必须存储 verifier，回调时要用 !!!
    localStorage.setItem('pkce_verifier', verifier);

    const params = new URLSearchParams({
        client_id: 'gallery_app_id', // 你的 App ID
        redirect_uri: 'http://119.91.71.30:5173/auth/callback', // 必须与 Account 后台配置完全一致
        response_type: 'code',
        scope: 'openid profile',
        code_challenge: challenge,
        code_challenge_method: 'S256'
    });

    window.location.href = `http://119.91.71.30/api/oauth/authorize?${params.toString()}`;
};
```

### 第四步：处理回调 (Callback 页面)

在 `http://119.91.71.30:5173/auth/callback` 路由页面中：

```javascript
// pages/AuthCallback.jsx
import { useEffect } from 'react';
import axios from 'axios';

export default function AuthCallback() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (code) {
            exchangeToken(code);
        }
    }, []);

    const exchangeToken = async (code) => {
        // 取出之前存的 verifier
        const verifier = localStorage.getItem('pkce_verifier');
        
        try {
            // 调用 Account 接口换取 Token
            const res = await axios.post('http://119.91.71.30/api/oauth/token', {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'http://119.91.71.30:5173/auth/callback',
                client_id: 'gallery_app_id',
                code_verifier: verifier // !!! 必须带上
            });

            const { access_token, user } = res.data;
            
            // 登录成功！保存 Token
            console.log("登录成功:", user);
            localStorage.setItem('token', access_token);
            window.location.href = '/'; // 跳转回首页
            
        } catch (err) {
            console.error("换取 Token 失败:", err);
            alert("登录失败，请重试");
        } finally {
            localStorage.removeItem('pkce_verifier'); // 清理
        }
    };

    return <div>正在登录...</div>;
}
```

---

## 3. 常见错误排查

| 错误码 | 错误信息 | 原因 | 解决方法 |
| :--- | :--- | :--- | :--- |
| **400** | `invalid_grant` | `code_verifier` 不匹配 | 检查 localStorage 是否存取正确，或是否跨域丢失。 |
| **400** | `invalid_request` | `redirect_uri` 不匹配 | 必须与 Account 数据库 `applications` 表中配置的完全一致（包含末尾斜杠等）。 |
| **410** | `deprecated_endpoint` | 还在用 `/sso/issue` | 你还在用旧版接口！请按本文档迁移到 `/oauth/authorize`。 |

---

## 4. 后端配置检查 (Account 侧)

确保 Account 数据库中已注册 Gallery 应用：

```sql
-- 检查配置
SELECT * FROM applications WHERE app_id = 'gallery_app_id';

-- 确保 redirect_uri 在白名单中
-- allowed_origins 必须包含 'http://119.91.71.30:5173/auth/callback'
```
