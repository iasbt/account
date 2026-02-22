# Frontend Architecture Standards (前端架构规范)

> **Status (状态)**: 🛡️ **Enforced (强制执行)**
> **Stack (技术栈)**: React + Vite + Zustand

## 1. Layered Architecture (分层架构)

*   **Pages (页面)**: `src/pages/` (仅包含视图逻辑)。
*   **Store (状态)**: `src/store/` (全局状态管理)。
*   **Services (服务)**: `src/services/` (API 调用封装)。
*   **Types (类型)**: `src/types/` (共享接口定义)。

## 2. Data Flow (数据流)
`Page` -> `Store` -> `Service` -> `ApiClient` -> `Backend`

## 3. Component Rules (组件规则)
*   **No Fetch in Pages**: UI 组件 **严禁** 直接调用 `fetch`。
*   **Use Services**: 所有 API 逻辑必须封装在 `services/*.ts` 中。
*   **Use Store**: 用户与认证等全局状态必须在 `store/*.ts` 中管理。

## 4. Auth Standard (认证标准)
*   **Token**: 由 `ApiClient` (拦截器) 统一管理。
*   **Type**: 使用 `types/auth.ts` 中定义的 `AuthUser`。
*   **Cycle**: 通过提取 Types 避免 Store <-> Service 的循环依赖。
