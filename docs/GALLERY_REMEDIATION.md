# Gallery Application Security Remediation Guide

> **Status**: **Manual Action Required**
> **Date**: 2026-02-27
> **Scope**: Gallery Frontend (`C:\My_Project\image`)
> **Priority**: P0 (Blocks SSO Logout)

## 🚨 Critical Action Required
**The automated agent was unable to modify files in `C:\My_Project\image` due to workspace restrictions.**
Please manually apply the changes described in Section 2.1 to `src/store/authStore.ts`.

## 1. Overview
During the security assessment, we identified two critical issues in the Gallery application integration with the hardened Account System:
1.  **Login Loop / Logout Failure**: Users are unable to fully logout, causing immediate re-login via SSO.
2.  **PKCE Verification**: Ensure the PKCE flow uses the correct S256 challenge generation and verification.
3.  **Client Registration**: The `gallery-client` was missing or misconfigured in the database. (✅ Fixed by agent script)

## 2. Remediation Steps

### 2.1 Fix Logout Loop (MANUAL ACTION NEEDED)
**File**: `src/store/authStore.ts`
**Action**: Update the `logout` action to explicitly redirect to the Account System's logout endpoint. This ensures the SSO session is cleared.

```typescript
// src/store/authStore.ts

logout: async () => {
  try {
    // 1. Clear local state first
    clearAuth();
    set({ 
      user: null, 
      hasAcceptedTerms: false, 
      hasSeenOnboarding: false 
    });
    usePreferenceStore.getState().reset();

    // 2. Redirect to Account System Logout to clear SSO session
    // This prevents the "Login Loop" where SSO immediately re-authenticates the user
    const accountUrl = import.meta.env.VITE_ACCOUNT_URL;
    if (accountUrl) {
      const redirectUri = window.location.origin;
      // Direct navigation to backend logout endpoint
      // This will clear the backend session cookie and redirect back to the app (or login page)
      window.location.href = `${accountUrl.replace(/\/$/, '')}/api/auth/logout?target=${encodeURIComponent(redirectUri)}`;
    }
  } catch (err) {
    console.warn('Logout error:', err);
    // Fallback
    clearAuth();
    set({ user: null });
  }
}
```

### 2.2 Verify PKCE Implementation
**File**: `src/lib/pkce.ts`
**Action**: Ensure `generateCodeChallenge` uses standard Base64URL encoding (replacing `+` with `-`, `/` with `_`, and removing `=`).

```typescript
// src/lib/pkce.ts

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hash));
  // Use a safer way to convert large arrays if needed, but for SHA-256 (32 bytes) this is fine
  const hashString = String.fromCharCode(...hashArray);
  const base64 = btoa(hashString);
  
  // Base64URL Encoding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

## 3. Deployment
After applying these changes:
1.  Commit the changes to the `image` repository.
2.  Rebuild the frontend image.
3.  Deploy using `deploy_gallery.ps1`.
