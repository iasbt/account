# System Topology (系统拓扑) - 架构篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🔒 **Frozen (V1.6 封板)**
> **Network**: `correction_default`

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
