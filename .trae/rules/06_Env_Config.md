# Account System V1.6 (Frozen) - Part 6: Env & Config

### 5.3 环境差异化

*   **Local**: 仅用于逻辑编写/测试 (`npm test`).
*   **Prod**: 必须运行在 **Docker** 中.

### 5.4 配置隔离

*   🚫 **禁止**: 推送真实 `.env` 到 Git.
*   ✅ **允许**: 修改 `.env.example`.

### 5.5 版本强校验 (Version)

后端修改必须 Bump Version.

**校验标准**: 部署后 `/api/health` 必须返回新版本号.
**判定**: 若返回旧版本号，即视为 **部署失败**.
