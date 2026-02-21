# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-11

### Added
- **Docker Deployment**: Created `deploy/docker-compose.yml` for full stack deployment (Nginx, MT Photos, PostgREST, Postgres).
- **Deployment Script**: Added `deploy_to_remote.ps1` for automated "one-click" deployment to Tencent Cloud via SSH.

### Changed
- **Server Migration**: Migrated from Supabase (SaaS) to self-hosted architecture on Tencent Cloud (119.91.71.30).
- **Domain Strategy**:
-    - `gallery.iasbt.cloud` -> **`img.iasbt.com`** (Unified Gallery URL).
- **Deployment Logic**:
    - Updated `deploy_to_remote.ps1` to automatically clean up conflicting `nginx-proxy-manager` containers.
    - Hardcoded database password in deployment script to prevent data loss on redeployment.

### Fixed
- **Nginx Port Conflict**: Resolved "Bind for 0.0.0.0:443 failed" by removing legacy containers.

### Security
- **SSH Access**: Enforced key-based authentication (`trae.pem`) for server access.
- **Network Isolation**: Backend services are now isolated in internal Docker network, only accessible via Nginx.
