# Roadmap & Future Plans (路线图与未来计划)

> **Status (状态)**: 📅 **Planning (规划中)**
> **Phase (阶段)**: 3.0

## 1. Immediate Next Steps (近期下一步 - Phase 3)
*   **Gallery Integration (相册集成)**:
    *   接入 Cloudflare R2 对象存储。
    *   实现图片缩放与优化。
*   **SSO Expansion (SSO 扩展)**:
    *   打通 `Gallery` (免登)。
    *   打通 `Toolbox` 与 `Life OS`。

## 2. Technical Debt (技术债务)
*   **Testing (测试)**: 将覆盖率提升至 >80%。
*   **Docs (文档)**: 补全 API Swagger/OpenAPI 文档。
*   **Monitoring (监控)**: 接入 APM 与日志聚合系统。

## 3. Architecture Red Lines (架构红线)
*   **No Monolith Growth (禁止单体膨胀)**: 新功能必须通过新模块或服务实现。
*   **Infra Stability (基建稳定)**: `deploy/correction` 目录必须保持稳定。
*   **Version Lock (版本锁定)**: 严禁对 `/api/health` 进行破坏性变更。

## 4. Collaboration (协作)
*   **Review (评审)**: Phase 3 的所有 PR 必须经过代码评审。
*   **Audit (审计)**: 定期清理 "Wild Files (野文件)"。
