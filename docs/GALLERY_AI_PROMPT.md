# Prompt for Gallery Project AI Agent

Please copy the following instructions and give them to the AI agent managing the **Image Gallery Project** (`C:\My_Project\image`).

---

## 🤖 Role: Gallery Project Maintainer

**Objective**: Configure the Image Gallery project to integrate with the Central Account System for Single Sign-On (SSO).

**Context**: 
The **Account System** (deployed at `http://119.91.71.30`) now acts as the Identity Provider (IdP). The original Supabase backend is deprecated for auth purposes. We must configure the Gallery app to accept JWTs issued by the Account System.

### 📋 Task Checklist

#### 1. Configure Environment Variables (`.env`)
*   `VITE_ACCOUNT_URL`: `http://119.91.71.30` (or `https://account.iasbt.com`)
*   `VITE_SUPABASE_URL`: `http://119.91.71.30` (Proxies to Account System)
*   `VITE_SUPABASE_ANON_KEY`: `any-string-works` (Not verified by Account System, but required by client)
*   `VITE_SUPABASE_JWT_SECRET`: The Secret from Account Admin Panel (Application Registry).

#### 2. Update Auth Callback (`src/auth/AuthCallback.tsx` or similar)
Ensure the callback page handles the `access_token` from the URL hash.
*   The Account System redirects back to: `http://localhost:5173/auth/callback#access_token=...&refresh_token=...`
*   Supabase Client `supabase.auth.getSession()` or `setSession()` should handle this automatically if `VITE_SUPABASE_URL` points correctly.

#### 3. Update Allowed Origins in Account System
Make sure your Gallery URL (e.g., `http://119.91.71.30:5173` or `http://localhost:5173`) is added to the **Application Registry** in the Account System Admin Panel.

#### 4. Check for Mixed Content
If Gallery is HTTPS (Vercel), Account System MUST be HTTPS.
Current Status: Account System is HTTP (`119.91.71.30`).
**Action**: Deploy Gallery to the same server using IP (recommended for now), or configure SSL for Account System.

---
