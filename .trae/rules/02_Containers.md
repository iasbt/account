# Account System V1.6 (Frozen) - Part 2: Containers

### 1.2 容器清单 (Container Whitelist)

| 容器名 | 镜像 | 职责 |
| :--- | :--- | :--- |
| **iasbt-postgres** | `postgres:14` | **唯一真理数据库**。存储用户/日志。 |
| **account-backend** | `node:18` | **业务核心**。Express.js API。 |
| **account-frontend** | `nginx` | **流量入口**。React/Vite 产物代理。 |
| **portainer** | `portainer` | **运维面板**。 |

> ⚠️ **严禁出现**：`nginx-gateway`, `postgres-business`, `postgrest` 等废弃容器。

### 1.3 核心原则

1.  **单体分层**: 避免微服务过度设计。
2.  **Docker Only**: 生产环境仅运行在 Docker 中。
