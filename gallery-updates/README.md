# Gallery 应用 JWKS & PKCE 适配更新

本目录包含将 Gallery 应用 (`C:\My_Project\image`) 更新以支持新版 OAuth 2.0 PKCE 流程和刷新令牌轮换 (Refresh Token Rotation) 所需的文件。

## 文件列表 (Files)

1.  `pkce.ts`: PKCE (Proof Key for Code Exchange) 工具函数。
2.  `utils.ts`: 更新后的认证工具 (`redirectToAuth`)，替代已废弃的隐式流 (Implicit Flow)。
3.  `api.ts`: 更新后的 Axios 拦截器，处理 401 错误并使用刷新令牌 (Refresh Token) 自动刷新令牌。
4.  `authStore.ts`: 更新后的 Zustand 状态库，初始化时同时加载访问令牌 (Access Token) 和刷新令牌 (Refresh Token)。
5.  `auth-utils.ts`: 更新后的存储工具，增加对刷新令牌 (Refresh Token) 的处理。
6.  `AuthCallback.tsx`: 新的回调页面，处理授权码 (Authorization Code) 交换。

## 如何更新 (How to Update)

由于 AI 助手受限于无法直接修改 `account` 仓库以外的文件，您需要手动应用这些更新。

我们为您提供了一个 PowerShell 脚本来自动化此过程。

### 选项 1: 运行脚本 (推荐)

在 `C:\My_Project\account` 目录下运行以下终端命令：

```powershell
.\update_gallery.ps1
```

### 选项 2: 手动复制

将文件复制到 `C:\My_Project\image\src` 中的对应位置：

| 源文件 (Source File) | 目标位置 (Destination) |
| :--- | :--- |
| `gallery-updates\pkce.ts` | `src\lib\pkce.ts` |
| `gallery-updates\utils.ts` | `src\lib\utils.ts` |
| `gallery-updates\api.ts` | `src\lib\api.ts` |
| `gallery-updates\auth-utils.ts` | `src\lib\auth-utils.ts` |
| `gallery-updates\authStore.ts` | `src\store\authStore.ts` |
| `gallery-updates\AuthCallback.tsx` | `src\pages\AuthCallback.tsx` |

## 验证 (Verification)

更新后，重新构建并启动 Gallery 应用。

确保以下几点：

1.  登录操作重定向到新的 `/api/oauth/authorize` 端点，且包含 `code_challenge` 参数。
2.  回调页面 (Callback) 正确处理 `code` 并将其交换为令牌。
3.  令牌 (Access Token + Refresh Token) 已存储在 localStorage 中。
4.  当 Access Token 过期时，能够自动触发令牌刷新。
