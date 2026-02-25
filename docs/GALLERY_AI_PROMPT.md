# Prompt for Gallery Project AI Agent

Please copy the following instructions and give them to the AI agent managing the **Image Gallery Project** (`C:\My_Project\image`).

---

## 🤖 Role: Gallery Project Maintainer

**Objective**: Configure the Image Gallery project to integrate with the Central Account System for Single Sign-On (SSO).

**Context**: 
The **Account System** (deployed at `http://119.91.71.30`) now acts as the Identity Provider (IdP). The original Supabase backend is deprecated for auth purposes. We must configure the Gallery app to accept JWTs issued by the Account System.

### 📋 Task Checklist

#### 1. Configure Environment Variables (`.env`)
Create or update the `.env` file in the project root (`C:\My_Project\image\.env`).
**CRITICAL**: Do NOT use the real Supabase URL. Use the Account System URL to proxy/mock the connection.

```ini
# --- Account SSO Configuration ---

# 1. Supabase Client Config (Mock Mode)
# Point to the Account System IP (Port 80 default).
# Note: If deploying to Vercel (HTTPS), direct HTTP calls will fail (Mixed Content).
# See "Vercel Deployment" section below for the fix.
VITE_SUPABASE_URL=http://119.91.71.30

# Account System validates the JWT signature directly. 
# This key is only for client initialization and is not checked by the Account System.
VITE_SUPABASE_ANON_KEY=any-random-string-for-initialization

# 2. SSO Redirect URL
# The login button should redirect here.
VITE_ACCOUNT_URL=http://119.91.71.30

# --- Existing Configuration (Keep These) ---
# Preserve any existing keys (e.g., Amap, R2, etc.)
# VITE_AMAP_KEY=...
```

#### 2. Verify Auth Callback Logic
Inspect `src/pages/AuthCallback.tsx`. Ensure it handles the **Hash Fragment** redirect from the Account System.
*   **Input**: URL like `http://localhost:5173/auth/callback#access_token=...&refresh_token=...`
*   **Logic**:
    1.  Extract `access_token` and `refresh_token` from `window.location.hash`.
    2.  Call `supabase.auth.setSession({ access_token, refresh_token })`.
    3.  Redirect to Home (`/`) on success.
    4.  Redirect to `VITE_ACCOUNT_URL` (Login) on failure/missing token.

#### 3. Constraints & Vercel Deployment (IMPORTANT)
*   **Mixed Content Issue**: Vercel forces **HTTPS**, but the Account System is currently **HTTP** (`http://119.91.71.30`). Browsers will block direct API calls from Vercel to HTTP.
    *   **Solution**: Configure `vercel.json` rewrites to proxy requests if API calls are needed, OR ensure `VITE_SUPABASE_URL` is only used for client-side state (no fetch).
    *   **Redirects**: HTTP/HTTPS redirects for Login **WILL** work fine.
*   **Allowed Origins**: 
    *   **ACTION REQUIRED**: You must tell the user to register the Vercel domain (e.g., `https://my-gallery.vercel.app`) in the Account System's Admin Panel (or database), otherwise Login will fail with "Unknown Application".

#### 4. Verification Plan
1.  Start the dev server (`npm run dev`).
2.  Check that the "Login" button links to: 
    `http://119.91.71.30/sso/issue?target=http://localhost:5173/auth/callback`
3.  Confirm that after login, the user is redirected back with a valid session.
