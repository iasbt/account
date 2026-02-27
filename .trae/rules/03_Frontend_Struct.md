# Frontend Architecture (前端架构) - 结构篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🛡️ **Strict (严格执行)**
> **Stack**: React + Vite + Zustand

## 1. 分层架构

*   **页面**: `src/pages/` (仅包含视图逻辑)。
*   **状态**: `src/store/` (全局状态管理)。
*   **服务**: `src/services/` (API 调用封装)。
*   **类型**: `src/types/` (共享接口定义)。

## 2. 数据流
`Page` -> `Store` -> `Service` -> `ApiClient` -> `Backend`
