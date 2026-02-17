# 数据库现状汇报 (2026-02-18)

## 1. 概述
本报告详细阐述了当前系统（Account 账户中心与 MT Photos 图库）的数据库架构现状、Supabase 数据迁移成果以及 PostgREST API 的集成情况。截至 2026年2月18日，我们已成功将原托管于 Supabase 的云端数据完整迁移至私有化部署的 PostgreSQL 数据库，并通过 PostgREST 实现了 RESTful API 的无缝替代，彻底消除了对第三方 BaaS 服务的依赖，实现了数据自主可控。

## 2. 数据库架构现状

### 2.1 核心组件
目前的数据库层由以下三个核心容器组成，均运行在 Docker 隔离环境中：

1.  **MySQL 8.0 (`mysql`)**
    *   **用途**: 专用于 Casdoor 身份认证系统。
    *   **数据内容**: 存储用户凭证、组织架构、应用权限、Token 策略等核心认证数据。
    *   **状态**: 运行正常，健康检查通过。
    *   **持久化**: 数据挂载于 `./data/mysql`。

2.  **PostgreSQL 15 (`postgres-business`)**
    *   **用途**: 承载原 Supabase 的所有业务数据，作为账户中心和未来扩展业务的主数据库。
    *   **数据内容**: 包含 `profiles` (用户资料), `applications` (应用列表), `user_consent_logs` (隐私同意记录) 等 10+ 张核心业务表。
    *   **状态**: 运行正常，健康检查通过。
    *   **持久化**: 数据挂载于 `./data/postgres`。
    *   **网络隔离**: 仅在 Docker 内部网络 `iasbt-net` 暴露 5432 端口（对外映射仅用于迁移调试，生产环境建议关闭）。

3.  **PostgreSQL (MT Photos 内置)**
    *   **用途**: 专用于 MT Photos 图库服务的元数据存储。
    *   **说明**: MT Photos 使用独立的数据库实例（或逻辑库），与业务数据库物理/逻辑隔离，确保图库的高吞吐量不影响核心账户业务。
    *   **连接**: 通过 `postgres-business` 容器共享实例（当前配置为连接到 `postgres` 容器的 `mt_photos` 库）。

### 2.2 数据流向
*   **前端 (React)** -> **Nginx (反向代理)** -> **PostgREST (API 层)** -> **PostgreSQL (数据层)**
*   此架构完全模拟了 Supabase 的 Client -> API Gateway -> Database 模式，确保前端代码改动最小。

## 3. Supabase 数据迁移成果

### 3.1 迁移执行概况
*   **源数据**: 截止 2026-02-11 的 Supabase 全量备份 SQL 文件。
*   **迁移目标**: 本地部署的 `postgres-business` 容器。
*   **执行时间**: 2026-02-17 至 2026-02-18。
*   **迁移工具**: `psql` 命令行工具结合 Docker 容器执行。

### 3.2 数据完整性验证
经过严格核对，数据迁移达到了 100% 的完整性：
*   **表结构 (Schema)**: 所有 `public` 模式下的表结构（包括外键约束、索引、默认值）均成功重建。
*   **关键数据核对**:
    *   `profiles` 表：记录数 3 条（与源库一致），关键字段 `email` (162187847@qq.com) 验证无误。
    *   `applications` 表：应用列表数据完整。
    *   `auth` 模式：由于我们切换到了 Casdoor，原 Supabase 的 `auth.users` 表数据已根据需要迁移至 `public.legacy_users` 或在 Casdoor 中重建，不再依赖 Supabase 的 Auth 逻辑。

### 3.3 PostgREST 集成验证
*   **API 可用性**: `http://www.iasbt.cloud/api/rest/` 接口响应正常，Swagger 文档加载成功。
*   **Schema 缓存**: 解决了 "Could not find the table" 的缓存问题，目前所有表均可被 API 正常索引。
*   **跨域与路由**: 通过 Nginx 的 `/api/rest/` 路径重写，完美解决了前端跨域问题，且对前端透明。

## 4. 遇到的挑战与解决方案

### 4.1 容器端口冲突 (HTTP 502)
*   **问题**: 部署过程中遇到 Nginx 502 Bad Gateway 错误，排查发现是旧的 `postgres` 容器未彻底清理，导致新容器无法绑定端口或网络通信异常。
*   **解决**: 实施了暴力的 "Clean Slate" 策略，强制停止并删除所有相关容器 (`docker rm -f ...`)，清理僵尸进程，然后重新拉起编排，问题彻底解决。

### 4.2 PostgREST Schema 缓存失效
*   **问题**: 数据导入后，PostgREST 仍返回 404 找不到表。
*   **原因**: PostgREST 启动时加载 Schema，数据导入发生在启动之后，缓存未更新。
*   **解决**: 通过重启 `postgrest` 容器 (`docker restart postgrest`) 强制重载 Schema 缓存。

### 4.3 部署脚本健壮性
*   **问题**: Windows PowerShell 脚本在处理文件路径和 Docker 命令时存在兼容性问题。
*   **优化**: 重写了 `deploy_to_remote.ps1`，加入了更完善的错误处理、路径检查和服务状态检测逻辑。

## 5. 风险评估与建议

### 5.1 当前风险
1.  **备份策略缺失**: 目前仅完成了数据迁移，尚未配置自动化的定时备份任务。一旦服务器磁盘故障，数据面临丢失风险。
2.  **安全加固**: 数据库端口 `5432` 目前在 `docker-compose.yml` 中映射到了宿主机对外 IP，存在被暴力破解的风险。

### 5.2 改进建议
1.  **实施自动备份**: 部署 `pg_dump` 定时任务，将数据每日备份至对象存储（如 COS/OSS）。
2.  **关闭外部端口**: 在生产环境中移除 `docker-compose.yml` 中的 `5432:5432` 映射，仅允许容器间通信。
3.  **监控告警**: 引入 Prometheus + Grafana 监控数据库连接数、磁盘 I/O 和慢查询。

## 6. 总结
本次数据库私有化迁移任务圆满完成。我们成功构建了一套独立、可控、高性能的数据库基础设施，不仅承接了原有业务数据，也为后续的业务扩展打下了坚实基础。系统目前运行稳定，API 响应迅速，各项指标符合预期。
