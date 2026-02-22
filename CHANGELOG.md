# Changelog

All notable changes to this project will be documented in this file.

## [V1.6] - 2026-02-22 (Frozen/Sealed)

### 🚀 Major Changes
- **Architecture Finalized**: "四合院" Project Matrix (Account System as Core Base).
- **Automated Deployment**: New `deploy_remote.ps1` script with Git-based workflow (Local -> GitHub -> Tencent Cloud).
- **Infrastructure Alignment**: 
    - Consolidated containers to `account-frontend`, `account-backend`, `iasbt-postgres`.
    - Enforced single Docker network (`correction_default`).
    - Standardized deployment path: `/home/ubuntu/account/deploy/correction`.

### ✨ Added
- **Health Check**: `GET /api/health` endpoint for version verification.
- **Documentation**: Created `ACCOUNT_SYSTEM_DEV_DOC_V1.6.md` as the single source of truth.
- **Security**: Strict whitelist for running containers.

### 🗑️ Removed (Legacy Cleanup)
- **PostgREST**: Replaced with custom Node.js API logic.
- **Nginx Gateway**: Merged into `account-frontend`.
- **Postgres Business**: Removed redundant database instance.
- **Supabase/MySQL**: Fully migrated to self-hosted PostgreSQL.

## [Unreleased] - 2026-02-11

### Added
- **Docker Deployment**: Created `deploy/docker-compose.yml` for full stack deployment (Nginx, PostgREST, Postgres).
- **Deployment Script**: Added `deploy_to_remote.ps1` for automated "one-click" deployment to Tencent Cloud via SSH.

### Changed
- **Server Migration**: Migrated from Supabase (SaaS) to self-hosted architecture on Tencent Cloud (119.91.71.30).
- **Domain Strategy**:
    - 相册域名统一为 **`img.iasbt.com`**。
- **Deployment Logic**:
    - Updated `deploy_to_remote.ps1` to automatically clean up conflicting `nginx-proxy-manager` containers.
    - Hardcoded database password in deployment script to prevent data loss on redeployment.

### Fixed
- **Nginx Port Conflict**: Resolved "Bind for 0.0.0.0:443 failed" by removing legacy containers.

### Security
- **SSH Access**: Enforced key-based authentication (`trae.pem`) for server access.
- **Network Isolation**: Backend services are now isolated in internal Docker network, only accessible via Nginx.
