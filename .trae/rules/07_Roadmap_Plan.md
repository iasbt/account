# Roadmap (路线图) - 未来计划

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Phase**: 3.0 (Planning/规划中)

## 1. 近期下一步 (Phase 3)
*   **Admin 后台管理系统** (In Progress):
    *   基础架构：Role Middleware & Admin Routes (已完成).
    *   用户管理：用户列表查询 (已完成).
    *   前端入口：AdminPanel 原型 (已完成).
*   **相册集成**:
    *   接入 Cloudflare R2 对象存储（已接入待确认）。
    *   实现图片缩放与优化。
*   **SSO 扩展**:
    *   接入指南：Account ↔ Gallery SSO 接入说明 (已完成).
    *   打通 `Gallery` (免登)。
    *   打通 `Toolbox` 与 `Life OS`。

## 2. 技术债务
*   **SSO**: 迁移隐式流至 OAuth 2.0 授权码模式。
*   **加密**: 从对称加密 (HS256) 迁移至非对称加密 (RS256)。
*   **测试**: 将覆盖率提升至 >80%。
*   **文档**: 补全 API Swagger/OpenAPI 文档。
*   **监控**: 接入 APM 与日志聚合系统。
