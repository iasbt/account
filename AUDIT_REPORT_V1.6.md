# Asset Snapshot Report V1.6 (Audit)

> **Generated**: 2026-02-22
> **Status**: Pending Cleanup
> **Scope**: Root & Deploy Directory

## 1. 废弃/重复文件 (To Be Deleted)

以下文件包含过时的架构定义（如 `postgres-business`, `PostgREST`）或重复的部署逻辑，建议立即删除以避免混淆。

| 文件路径 | 原因 | 风险等级 |
| :--- | :--- | :--- |
| `c:\My_Project\account\deploy_to_remote.ps1` | 包含废弃的 PostgREST/postgres-business 逻辑；硬编码旧路径。 | High |
| `c:\My_Project\account\deploy\docker-compose.yml` | 定义了 `postgres-business` (已封禁)；非 Source of Truth。 | High |
| `c:\My_Project\account\vercel.json` | 指向 `119.91.71.30:8080` (端口 8080 已废弃)；Vercel 部署已过时。 | Medium |
| `c:\My_Project\account\deploy\backup_supabase.ps1` | 涉及旧 Supabase 备份逻辑 (如不再使用建议归档)。 | Low |

## 2. 硬编码 IP 审查 (Hardcoded IPs)

| 文件路径 | 内容 | 建议 |
| :--- | :--- | :--- |
| `c:\My_Project\account\deploy_remote.ps1` | `$ServerIP = "119.91.71.30"` | 保留 (作为部署目标 IP)。 |
| `c:\My_Project\account\vercel.json` | `http://119.91.71.30:8080` | **删除文件** (端口不可达)。 |

## 3. 版本对齐 (Version Alignment)

*   **Package.json**: `1.6.0` (✅ Consistent)
*   **Deploy Script**: `deploy_remote.ps1` 仅检查 "version" 字段存在，未校验具体版本号。
    *   **建议**: 升级健康检查逻辑，解析 JSON 并比对版本号 (需安装 `jq` 或优化 grep 逻辑)。

## 4. 后端对齐 (Backend Alignment)

*   **Database Host**: `deploy/correction/docker-compose.yml` 设置 `DB_HOST=iasbt-postgres` (✅ Correct).
*   **API Prefix**: `server.js` 强制 `/api/` 前缀 (✅ Correct).

## 5. 清理方案 (Cleanup Plan)

1.  **Delete**:
    *   `deploy_to_remote.ps1`
    *   `deploy/docker-compose.yml`
    *   `vercel.json`
2.  **Update**:
    *   `deploy_remote.ps1`: 增强版本校验逻辑。
3.  **Verify**:
    *   重新运行 `deploy_remote.ps1` 验证部署流程。

请确认执行以上清理方案。
