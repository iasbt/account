# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-11

### Added
- **Casdoor Integration**: Introduced Casdoor as the primary Identity Provider (IdP) to replace Supabase Auth.
- **Docker Deployment**: Created `deploy/docker-compose.yml` for full stack deployment (Casdoor, MySQL, Nginx, MT Photos).
- **Deployment Script**: Added `deploy_to_remote.ps1` for automated "one-click" deployment to Tencent Cloud via SSH.
- **Documentation**:
    - `deployment_docs/SERVER_DEPLOYMENT_MANUAL.md`: Detailed server operation manual.
    - `deployment_docs/CASDOOR_INTEGRATION_GUIDE.md`: Guide for integrating frontend with Casdoor.
    - `MIGRATORY_BIRD_DEPLOY.md`: Architecture guide for portable server migration.
- **Frontend Pages**:
    - `src/pages/CasdoorCallbackPage.tsx`: Handles OAuth 2.0 callback from Casdoor.
    - `src/lib/casdoor.ts`: SDK configuration.

### Changed
- **Server Migration**: Migrated from Supabase (SaaS) to self-hosted architecture on Tencent Cloud (119.91.71.30).
- **Domain Strategy**:
    - `gallery.iasbt.cloud` -> **`iasbt.cloud`** (Unified Gallery URL).
    - `account.iasbt.cloud` (Auth Service).
- **Casdoor Configuration**:
    - Fixed `app.conf` log level error (String "info" -> Int 6).
    - Enabled `client_max_body_size 0` in Nginx for unlimited photo uploads.
- **Deployment Logic**:
    - Updated `deploy_to_remote.ps1` to automatically clean up conflicting `nginx-proxy-manager` containers.
    - Hardcoded database password in deployment script to prevent data loss on redeployment.

### Fixed
- **Nginx Port Conflict**: Resolved "Bind for 0.0.0.0:443 failed" by removing legacy containers.
- **Casdoor Boot Loop**: Fixed JSON unmarshal error in `logConfig` and MySQL permission issues.

### Security
- **SSH Access**: Enforced key-based authentication (`trae.pem`) for server access.
- **Network Isolation**: Backend services (MySQL, Casdoor) are now isolated in internal Docker network, only accessible via Nginx.
