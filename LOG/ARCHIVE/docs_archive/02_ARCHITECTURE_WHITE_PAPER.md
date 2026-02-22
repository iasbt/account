# 架构优化白皮书 (Architecture Optimization White Paper)

> **评估对象**: Account System V1.6
> **版本**: V1.0
> **状态**: ⚪ **White Paper** (For Review)

## 1. 架构现状与问题

### 1.1 逻辑架构 (Logical Architecture)
目前系统为典型的 **SPA (React)** + **Monolith (Express)** 架构。

*   **前端 (Presentation)**:
    *   **React + Vite**: 构建在 `src/` 中。
    *   **Zustand**: 状态管理（Store 承担了 API 调用职责，导致 **Store Bloated**）。
    *   **Components**: 页面级组件与业务逻辑紧密耦合。
*   **后端 (Backend)**:
    *   **Single File**: `server.js` 承担了所有职责（路由、控制器、中间件、数据库查询）。
    *   **Postgres**: 直接使用 `pg` (node-postgres) 库，无 ORM/Query Builder，易产生 SQL 注入风险（虽然已使用参数化查询，但开发效率低且难以维护）。

### 1.2 部署架构 (Deployment Architecture)
已通过 **V1.6** 固化，非常成熟且稳定：
*   **Docker Compose**: 编排 `account-backend`, `account-frontend`, `iasbt-postgres`。
*   **Network**: `correction_default` 隔离网络。
*   **Health Check**: `/api/health` 强校验版本。

### 1.3 核心问题识别

1.  **Backend Spaghetti (面条代码)**: `server.js` 随着 Phase 3 (Gallery) 的加入将变得不可维护。必须拆分。
2.  **State Management Chaos**: Store 既是 State 又是 Service，违反单一职责原则。
3.  **Data Access Layer**: 无抽象层，SQL 散落在 Controller 中，难以复用和测试。

## 2. 优化方案 (Refactoring Strategy)

### 2.1 后端重构：Layered Architecture (分层架构)

建议将 `server.js` 拆解为以下结构：

```text
/server
├── /controllers   # 处理 HTTP 请求/响应 (Req/Res, Validation)
├── /services      # 核心业务逻辑 (Auth, Email, User)
├── /repositories  # 数据访问层 (SQL Queries, ORM)
├── /middlewares   # 中间件 (Auth, Error, Logger)
├── /routes        # 路由定义 (Express Router)
├── /config        # 配置 (Env, Constants)
└── app.js         # 应用入口 (Setup Express)
```

**关键收益**:
*   **Testability**: Service 层可以被单独测试（无需 HTTP 请求）。
*   **Reusability**: 可以在不同 Controller 复用 Service 逻辑。

### 2.2 前端重构：Separation of Concerns (关注点分离)

建议重构前端 API 调用：

1.  **API Client**: 封装 `src/lib/api.ts` (使用 Axios 或 fetch wrapper)，统一处理 `BaseURL`、`Authorization` 头、`Error Handling`。
2.  **Service Layer**: 创建 `src/services/auth.ts`, `src/services/gallery.ts`，负责调用 API Client 并返回数据。
3.  **Store Layer**: `useAuthStore` 仅负责调用 Service 并更新 State，不处理 HTTP 细节。

### 2.3 数据层：引入 Query Builder

考虑到全量引入 ORM (Prisma/TypeORM) 可能过重，建议引入 **Knex.js** 或 **Kysely**：
*   **Type Safety**: 提供更好的类型提示。
*   **Migration**: 管理数据库变更（目前依靠手动 SQL）。
*   **Query Building**: 动态构建复杂查询（这对 Gallery 筛选非常重要）。

## 3. 架构演进路线图 (Evolution Roadmap)

### Phase 2.5: Refactor (Current)
1.  **Backend Split**: 将 `server.js` 拆分为 `routes/`, `controllers/`。
2.  **Frontend API Unification**: 统一 API Client。

### Phase 3: Gallery Integration
1.  **Service Layer**: 在新架构上开发 Gallery Service。
2.  **Data Layer**: 引入 Knex.js 管理 `gallery` schema。

### Phase 4: Scalability
1.  **Cache**: 引入 Redis 缓存热点数据（如 Gallery List）。
2.  **Job Queue**: 引入 BullMQ 处理图片压缩/转码任务。

## 4. 结论

**V1.6** 的部署架构已足够优秀，无需变动。现在的核心任务是**代码架构（Code Architecture）的重构**，以支撑 Phase 3 的业务复杂度。

**立即行动**: 启动 `server.js` 拆分与前端 API 统一。
