# Critical Red Lines (核心红线) - Violation = Rollback (违规即回滚)

> **Status (状态)**: 🔴 **STRICT ENFORCEMENT (严格执行)**
> **Priority (优先级)**: P0

## 1. Path Absolutization (路径绝对化)
*   **Rule (规则)**: 脚本与配置中严禁使用相对路径。
*   **Must (必须)**: 必须使用 `/home/ubuntu/account/deploy/correction/`。
*   **Why (原因)**: 防止执行上下文错误。

## 2. Deployment Atomicity (部署原子化)
*   **Flow (流程)**: Local Edit (本地编辑) -> Git Push -> Remote Pull (远程拉取)。
*   **Ban (禁止)**: 🚫 严禁直接在服务器上修改文件。
*   **Sync (同步)**: 服务器状态必须与 `main` 分支保持镜像一致。

## 3. Config Isolation (配置隔离)
*   **Secret (机密)**: 🚫 严禁将真实的 `.env` 推送到 Git。
*   **Action (行动)**: 仅允许修改 `.env.example`。
*   **Prod (生产)**: 必须通过 Docker Env 或服务器端 `.env` 注入机密信息。

## 4. Version Strong Verification (版本强校验)
*   **Trigger (触发)**: 后端逻辑变更 = Version Bump (版本递增)。
*   **Check (检查)**: `deploy_remote.ps1` 必须校验 `/api/health`。
*   **Fail (失败)**: 若版本号与旧版本一致 -> **FAIL (部署失败)**。

## 5. Environment Differentiation (环境差异化)
*   **Local (本地)**: 仅用于逻辑开发与测试。
*   **Prod (生产)**: 必须且仅能运行在 Docker 容器中，严禁运行裸 Node.js 进程。