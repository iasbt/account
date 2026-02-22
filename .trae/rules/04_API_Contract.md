# Account System V1.6 (Frozen) - Part 4: API

### 3.1 健康检查 (Health)

**Endpoint**: `GET /api/health`

**Success Metric**:
```json
{
  "status": "ok",
  "service": "account-backend",
  "version": "1.6"
}
```

### 3.2 认证 (Auth)

*   `POST /api/auth/register`
*   `POST /api/auth/login` (JWT)
*   `GET /api/auth/me`

### 3.3 废弃方案 (Legacy)

❌ **严禁启用**:
1.  PostgREST
2.  独立 Nginx Gateway
3.  Postgres Business (双库)
4.  Kubernetes/HPA
