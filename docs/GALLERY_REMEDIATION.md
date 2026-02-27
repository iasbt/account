# Gallery 应用安全修复指南 (Gallery Remediation Guide)

> **状态**: **需人工干预 (Manual Action Required)**
> **日期**: 2026-02-27
> **范围**: Gallery 前端 (`C:\My_Project\image`)
> **优先级**: P0 (阻塞 SSO 登出功能)

## 🚨 紧急行动指南
**由于工作区限制，自动化代理无法直接修改 `C:\My_Project\image` 目录下的文件。**
请根据第 2.1 节的说明，手动修改 `src/store/authStore.ts` 文件。

## 1. 概述
在本次安全评估中，我们发现 Gallery 应用与加固后的账号系统集成存在两个关键问题：
1.  **登录循环 / 登出失败**: 用户无法完全登出，导致 SSO 立即重新登录。
2.  **PKCE 验证**: 需确保 PKCE 流程使用正确的 S256 挑战码生成与验证逻辑。
3.  **客户端注册**: 数据库中缺少 `gallery-client` 配置或配置错误。(✅ 已通过代理脚本自动修复)

## 2. 修复步骤

### 2.1 修复登出循环 (需人工操作)
**文件**: `src/store/authStore.ts`
**操作**: 更新 `logout` 动作，显式重定向到账号系统的登出端点。这能确保清除 SSO 会话。

```typescript
// src/store/authStore.ts

logout: async () => {
  try {
    // 1. 首先清除本地状态
    clearAuth();
    set({ 
      user: null, 
      hasAcceptedTerms: false, 
      hasSeenOnboarding: false 
    });
    usePreferenceStore.getState().reset();

    // 2. 重定向到账号系统登出接口以清除 SSO 会话
    // 这能防止 "登录循环"，即 SSO 立即重新认证用户
    const accountUrl = import.meta.env.VITE_ACCOUNT_URL;
    if (accountUrl) {
      const redirectUri = window.location.origin;
      // 直接导航到后端登出端点
      // 这将清除后端会话 Cookie 并重定向回应用（或登录页）
      window.location.href = `${accountUrl.replace(/\/$/, '')}/api/auth/logout?target=${encodeURIComponent(redirectUri)}`;
    }
  } catch (err) {
    console.warn('Logout error:', err);
    // 降级处理
    clearAuth();
    set({ user: null });
  }
}
```

### 2.2 验证 PKCE 实现
**文件**: `src/lib/pkce.ts`
**操作**: 确保 `generateCodeChallenge` 使用标准的 Base64URL 编码（替换 `+` 为 `-`，`/` 为 `_`，并移除 `=`）。

```typescript
// src/lib/pkce.ts

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hash));
  // 对于 SHA-256 (32 字节)，这种转换方式是安全的
  const hashString = String.fromCharCode(...hashArray);
  const base64 = btoa(hashString);
  
  // Base64URL 编码规范
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

## 3. 部署
应用上述更改后：
1.  提交更改到 `image` 仓库。
2.  重新构建前端镜像。
3.  使用 `deploy_gallery.ps1` 进行部署。
