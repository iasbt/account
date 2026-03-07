# Frontend Architecture (前端架构) - 规范篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🛡️ **Strict (严格执行)**
> **Stack**: React + Vite + Zustand

## 1. 组件规则
*   **页面无 Fetch**: UI 组件 **严禁** 直接调用 `fetch`。
*   **使用 Service**: 所有 API 逻辑必须封装在 `services/*.ts` 中。
*   **使用 Store**: 用户与认证等全局状态必须在 `store/*.ts` 中管理。

## 2. 认证标准
*   **Token**: 由 Logto SDK (`@logto/react`) 自动管理，通过 `getAccessToken` 获取。
*   **类型**: 使用 `lib/logtoUser.ts` 或 Logto SDK 提供的类型。
*   **状态**: 使用 `useLogto` Hook 获取认证状态。
