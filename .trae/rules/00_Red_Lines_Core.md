# Critical Red Lines (核心红线) - 基础篇

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Enforcement**: 🔴 **Strict (严格执行)**
> **Priority**: P0

## 1. 路径绝对化
*   **规则**: 脚本与配置中严禁使用相对路径。
*   **必须**: 必须使用 `/home/ubuntu/account/deploy/correction/`。
*   **原因**: 防止执行上下文错误。

## 2. 部署原子化
*   **流程**: 本地编辑 -> Git Push -> 远程拉取。
*   **禁止**: 🚫 严禁直接在服务器上修改文件。
*   **同步**: 服务器状态必须与 `main` 分支保持镜像一致。

## 3. 配置隔离
*   **机密**: 🚫 严禁将真实的 `.env` 推送到 Git。
*   **行动**: 仅允许修改 `.env.example`。
*   **生产**: 必须通过 Docker Env 或服务器端 `.env` 注入机密信息。
