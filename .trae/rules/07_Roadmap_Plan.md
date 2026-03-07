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
*   **SSO 扩展** (Completed):
    *   **全面接入 Logto**: 已完成 Account 与 Gallery 的 Logto OIDC 集成。
    *   **废弃本地认证**: 已移除所有本地 JWT/OAuth 逻辑。

## 2. 技术债务
*   **测试**: 将覆盖率提升至 >80%。
*   **文档**: 补全 API Swagger/OpenAPI 文档。
*   **监控**: 接入 APM 与日志聚合系统。
