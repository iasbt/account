# Roadmap & Future Plans (路线图与未来计划)

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Phase**: 3.0 (Planning/规划中)

## 1. 近期下一步 (Phase 3)
*   **相册集成**:
    *   接入 Cloudflare R2 对象存储。
    *   实现图片缩放与优化。
*   **SSO 扩展**:
    *   打通 `Gallery` (免登)。
    *   打通 `Toolbox` 与 `Life OS`。

## 2. 技术债务
*   **测试**: 将覆盖率提升至 >80%。
*   **文档**: 补全 API Swagger/OpenAPI 文档。
*   **监控**: 接入 APM 与日志聚合系统。

## 3. 架构红线
*   **禁止单体膨胀**: 新功能必须通过新模块或服务实现。
*   **基建稳定**: `deploy/correction` 目录必须保持稳定。
*   **版本锁定**: 严禁对 `/api/health` 进行破坏性变更。

## 4. 协作
*   **评审**: Phase 3 的所有 PR 必须经过代码评审。
*   **审计**: 定期清理 "Wild Files (野文件)"。
