# System Topology & Containers (系统拓扑与容器)

> **状态**: 🔒 **V1.6 封板**
> **网络**: `correction_default`

## 1. 四边形矩阵
*   **边缘**: Nginx (前端/网关)
*   **核心**: Node.js (业务逻辑)
*   **数据**: Postgres (唯一真理)
*   **运维**: Portainer (管理)

## 2. 容器白名单

| Container | Image | Role (角色) |
| :--- | :--- | :--- |
| `iasbt-postgres` | `postgres:14` | **数据**。存储用户与日志。 |
| `account-backend`| `node:20-alpine`| **接口**。Express.js 核心。 |
| `account-frontend`| `nginx` | **Web**。React SPA 产物。 |
| `portainer` | `portainer` | **运维**。可视化管理。 |

## 3. 网络规则
*   **内部**: `correction_default` 桥接网络。
*   **暴露**:
    *   443/80 (Nginx)
    *   5432 (Postgres - 建议仅内部访问)
*   **DNS**: 容器间必须通过服务名验证 (如 `iasbt-postgres`)。

🚫 **废弃禁令**: 严禁使用 `nginx-gateway`, `postgrest`, `postgres-business`。
