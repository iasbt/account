# Findings & Research

> **Topic**: Security Assessment & Competitor Analysis
> **Last Updated**: 2026-02-27

## 1. Security Assessment Findings

### 1.1 Dependency Analysis
*   **Status**: Mostly up-to-date.
*   **Concerns**:
    *   `zod`: Version `^4.3.6` (likely alpha/beta). Recommendation: Pin to stable v3.x or verify v4 stability.
    *   `bcryptjs`: Pure JS implementation. Recommendation: Keep for portability unless performance is an issue.

### 1.2 Static Code Analysis
*   **Helmet Config (`app.js`)**:
    *   ❌ **CSP Disabled**: `contentSecurityPolicy: false`. High XSS risk.
    *   ⚠️ **COOP Disabled**: `crossOriginOpenerPolicy: false`. Required for SSO but reduces isolation.
*   **Rate Limiting**:
    *   ✅ Applied to Auth routes (`routes/authRoutes.js`).
    *   ⚠️ Threshold: `300/min` for login is generous. Recommendation: Lower to `60/min` or implement exponential backoff.
*   **Input Validation**:
    *   ✅ Zod schemas applied to all Auth endpoints.
    *   ✅ SQL Injection protection via parameterized queries (`$1`).
*   **Secret Management (`config/index.js`)**:
    *   ⚠️ `ssoSecret` defaults to empty string. Critical risk if env missing.

### 1.3 Architecture Review
*   **Current State**:
    *   Auth: OAuth 2.0 + OIDC (PKCE supported).
    *   Token: JWT (RS256).
    *   Session: Refresh Token Rotation (DB-backed).
    *   CORS: Strict Origin Matching.

## 2. Competitor Analysis

### 2.1 Keycloak (Reference)
*   **Features**:
    *   User Federation (LDAP/AD).
    *   Identity Brokering.
    *   Fine-grained Authorization.
*   **Security Controls**:
    *   Brute Force Detection (Temporary Lockout).
    *   Clickjacking Protection (X-Frame-Options).
    *   CSP (Content Security Policy).

### 2.2 Casdoor (Reference)
*   **Features**:
    *   Multi-tenancy (Organizations).
    *   RESTful API + SDKs.
    *   Audit Logs (Table-based).

### 2.3 Authelia (Reference)
*   **Features**:
    *   2FA (TOTP/Duo/YubiKey).
    *   Proxy-based Auth (Nginx integration).

## 3. Gap Analysis
| Feature | Trae Account | Keycloak | Casdoor | Gap |
| :--- | :--- | :--- | :--- | :--- |
| **MFA/2FA** | ❌ Missing | ✅ Native | ✅ Native | High |
| **Audit Logs** | ⚠️ Basic (Winston) | ✅ Database | ✅ Database | Medium |
| **Brute Force** | ⚠️ Rate Limit only | ✅ Lockout | ✅ Lockout | Medium |
| **CSP** | ❌ Disabled | ✅ Strict | ✅ Configurable | Critical |

## 4. Proposed Roadmap (Prioritized)

### P0: Critical Fixes (Immediate)
1.  **CSP Enforcement**: Enable Helmet CSP with safe defaults.
2.  **Secret Validation**: Crash server if `SSO_JWT_SECRET` is missing (non-dev).
3.  **Strict Rate Limits**: Lower login limit to `10/min` per IP for failed attempts (if possible) or `60/min` total.

### P1: Core Security Enhancements (This Week)
1.  **Audit Logs**: Create `security_logs` table and record Login/Register/SSO events.
2.  **Brute Force Lockout**: Redis-based counter to lock account after 5 failed attempts.

### P2: Feature Parity (Next Month)
1.  **MFA/TOTP**: Implement Time-based One-Time Password.
2.  **Admin Dashboard**: Visualize audit logs and manage lockouts.
