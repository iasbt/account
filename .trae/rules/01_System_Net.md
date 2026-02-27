# System Topology (系统拓扑) - 网络篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🔒 **Frozen (V1.6 封板)**
> **Network**: `correction_default`

## 1. 网络规则
*   **内部**: `correction_default` 桥接网络。
*   **暴露**:
    *   443/80 (Nginx)
    *   5432 (Postgres - 建议仅内部访问)
*   **DNS**: 容器间必须通过服务名验证 (如 `iasbt-postgres`)。

🚫 **废弃禁令**: 严禁使用 `nginx-gateway`, `postgrest`, `postgres-business`。
