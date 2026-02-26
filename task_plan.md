# Task Plan: Account System Full Development (V1.8.15+)

> **Status**: In Progress
> **Goal**: Complete full development work based on `IASBT 账号中心 (Account) 模块开发与进阶说明书.md` and Roadmap.

## Phase 1: Security Fixes [In Progress]
- [ ] Fix `Math.random()` usage in `adminController.js` (Reset Password).
- [ ] Verify no other `Math.random()` usage for security critical operations.

## Phase 2: OAuth 2.0 Authorization Code Flow (SSO Refactor) [Pending]
- [ ] Create `oauth_codes` table (or use Redis) to store authorization codes.
- [ ] Implement `GET /oauth/authorize` endpoint.
    - Validate `client_id` (app_id) and `redirect_uri`.
    - Generate short-lived code (crypto).
    - Store code -> user_id, client_id, scope, expiration.
    - Redirect to `redirect_uri?code=...`.
- [ ] Implement `POST /oauth/token` endpoint.
    - Validate `client_id`, `client_secret`, `code`.
    - Verify code validity and expiration.
    - Issue Access Token (JWT) and Refresh Token.
    - Invalidate used code.
- [ ] Update Documentation to reflect new OAuth 2.0 endpoints.

## Phase 3: Verification [Pending]
- [ ] Verify Admin Reset Password flow.
- [ ] Verify OAuth 2.0 flow with a test client (e.g., Postman/Curl).

## Phase 4: Documentation & Cleanup [Pending]
- [ ] Update `API_Specs.md`.
- [ ] Update `Roadmap.md`.
