# Asset Snapshot Report V1.6 (Audit - Final)

> **Generated**: 2026-02-22
> **Status**: ✅ **CLEAN & VERIFIED**
> **Scope**: Root & Deploy Directory

## 1. 废弃/重复文件 (Cleanup Status)

| 文件路径 | 状态 | 备注 |
| :--- | :--- | :--- |
| `c:\My_Project\account\deploy_to_remote.ps1` | 🗑️ **Deleted** | 废弃的旧脚本。 |
| `c:\My_Project\account\deploy\docker-compose.yml` | 🗑️ **Deleted** | 非 Source of Truth。 |
| `c:\My_Project\account\vercel.json` | 🗑️ **Deleted** | Vercel 部署已废弃。 |
| `c:\My_Project\account\.trae\rules\abc.md` | 🗑️ **Deleted** | 野文件。 |

## 2. 硬编码 IP 审查 (Hardcoded IPs)

| 文件路径 | 内容 | 状态 |
| :--- | :--- | :--- |
| `c:\My_Project\account\deploy_remote.ps1` | `$ServerIP = "119.91.71.30"` | ✅ **Approved** (Target Server IP)。 |
| `c:\My_Project\account\package.json` | `http://119.91.71.30:8000` | ✅ **Approved** (Casdoor URL)。 |

## 3. 版本对齐 (Version Alignment)

*   **Package.json**: `1.6.1` (✅ Source of Truth)
*   **Server.js**: `1.6.1` (✅ Aligned)
*   **Deploy Script**: `deploy_remote.ps1` (✅ Strong Verification)
    *   **Method**: `grep "$LocalVersion"` (Simplest string match).
    *   **Result**: Verified `1.6.1` in `/api/health` response.

## 4. 后端对齐 (Backend Alignment)

*   **Database Host**: `deploy/correction/docker-compose.yml` uses `DB_HOST=iasbt-postgres` (✅ Correct).
*   **Network**: `account-backend` uses `correction_default` (✅ Correct).
*   **Dockerfile**: Upgraded to `node:20-alpine` (✅ Correct).

## 5. 结论 (Conclusion)

Phase 2 (固边) 任务已完成。
1.  **Version 1.6.1** 已成功部署并验证。
2.  **Asset List** 已在 `12.md` 中封板。
3.  **Deploy Pipeline** 已加固。
4.  **Wild Files** 已清理。
