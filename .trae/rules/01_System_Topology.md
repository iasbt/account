# System Topology & Containers (系统拓扑与容器)

> **Status (状态)**: 🔒 **Frozen (V1.6 封板)**
> **Net (网络)**: `correction_default`

## 1. The Quadrangle Matrix (四边形矩阵)
*   **Edge (边缘)**: Nginx (Frontend/Gateway - 前端/网关)
*   **Core (核心)**: Node.js (Business Logic - 业务逻辑)
*   **Data (数据)**: Postgres (Truth - 唯一真理)
*   **Ops (运维)**: Portainer (Management - 管理)

## 2. Container Whitelist (容器白名单)

| Container | Image | Role (角色) |
| :--- | :--- | :--- |
| `iasbt-postgres` | `postgres:14` | **Data (数据)**。存储用户与日志。 |
| `account-backend`| `node:20-alpine`| **API (接口)**。Express.js 核心。 |
| `account-frontend`| `nginx` | **Web (前端)**。React SPA 产物。 |
| `portainer` | `portainer` | **Ops (运维)**。可视化管理。 |

## 3. Network Rules (网络规则)
*   **Internal (内部)**: `correction_default` 桥接网络。
*   **Exposed (暴露)**:
    *   443/80 (Nginx)
    *   5432 (Postgres - 建议仅内部访问)
*   **DNS**: 容器间必须通过服务名验证 (如 `iasbt-postgres`)。

🚫 **Legacy Ban (废弃禁令)**: 严禁使用 `nginx-gateway`, `postgrest`, `postgres-business`。
