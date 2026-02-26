# Roadmap & Future Plans (路线图与未来计划)

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Phase**: 3.0 (Planning/规划中)

## 1. 最近完成 (Phase 1 - Security Hardening)
*   **安全加固 (V1.8.15)**:
    *   **Token Blacklist**: 引入 Redis 黑名单机制，解决 JWT 无状态注销问题。
    *   **Crypto Randomness**: 替换 `Math.random()` 为 `crypto.randomInt()`。
    *   **Rate Limiting**: 全局与认证接口限流 (`express-rate-limit`)。
    *   **Logout**: 修复退出登录漏洞，增加重定向白名单校验。

## 2. 近期下一步 (Phase 3)
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

## 3. 技术债务
*   **SSO**: 迁移隐式流至 OAuth 2.0 授权码模式。
*   **加密**: 从对称加密 (HS256) 迁移至非对称加密 (RS256)。
*   **测试**: 将覆盖率提升至 >80%。
*   **文档**: 补全 API Swagger/OpenAPI 文档。
*   **监控**: 接入 APM 与日志聚合系统。

## 4. 架构红线
*   **禁止单体膨胀**: 新功能必须通过新模块或服务实现。
*   **基建稳定**: `deploy/correction` 目录必须保持稳定。
*   **版本锁定**: 严禁对 `/api/health` 进行破坏性变更。

## 5. 协作
*   **评审**: Phase 3 的所有 PR 必须经过代码评审。
*   **审计**: 定期清理 "Wild Files (野文件)"。
