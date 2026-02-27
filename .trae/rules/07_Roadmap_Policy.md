# Roadmap (路线图) - 政策与协作

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Phase**: 3.0 (Planning/规划中)

## 1. 架构红线
*   **禁止单体膨胀**: 新功能必须通过新模块或服务实现。
*   **基建稳定**: `deploy/correction` 目录必须保持稳定。
*   **版本锁定**: 严禁对 `/api/health` 进行破坏性变更。

## 2. 协作
*   **评审**: Phase 3 的所有 PR 必须经过代码评审。
*   **审计**: 定期清理 "Wild Files (野文件)"。
