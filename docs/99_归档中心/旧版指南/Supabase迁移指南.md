# Supabase 迁移指南（已废弃）

## 废弃声明（强制）
- Supabase 相关方案已废弃，**严禁使用**。
- 本文仅用于历史留档，不再作为实施依据。

## 现行方案（替代执行）

### 1. 统一架构
- **后端**：Account Backend（Node.js + Express）
- **认证**：标准 JWT（非 Supabase 兼容）
- **数据库**：自建 PostgreSQL 容器 `iasbt-postgres`

### 2. 数据库初始化与结构
- 结构清单：`docs/支持文档/部署运维/附件/database.sql`
- 图示参考：`docs/支持文档/部署运维/附件/dbdiagram.dbml`

### 3. 认证与 SSO 使用方式
- 登录：`POST /api/auth/login` -> 返回 `token` 与 `user`
- 用户态：`GET /api/auth/me`（Bearer Token）
- SSO：`GET /api/sso/issue?target=...`（回跳 URL 的 Hash Fragment 携带 Token）

### 4. 环境变量与密钥
- 统一在 `.env` 维护：`SSO_SECRET_*` 与 `CORS_ALLOWLIST`
- **禁止**出现：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`

### 5. 远程部署目录（强制绝对路径）
```bash
cd /home/ubuntu/account/deploy/correction/
```
