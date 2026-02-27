# Critical Red Lines (核心红线) - 运维篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🔴 **Strict (严格执行)**
> **Priority**: P0

## 1. 版本强校验
*   **触发**: 后端逻辑变更 = 版本递增。
*   **检查**: `deploy_remote.ps1` 必须校验 `/api/health`。
*   **失败**: 若版本号与旧版本一致 -> **部署失败**。

## 2. 环境差异化
*   **本地**: 仅用于逻辑开发与测试。
*   **生产**: 必须且仅能运行在 Docker 容器中，严禁运行裸 Node.js 进程。
