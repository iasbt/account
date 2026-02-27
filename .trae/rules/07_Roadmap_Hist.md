# Roadmap (路线图) - 历史与现状

> **Status**: Active
> **Effective Date**: 2026-02-22
> **Phase**: 3.0 (Planning/规划中)

## 1. 最近完成 (Phase 1 - Security Hardening)
*   **安全加固 (V1.8.15)**:
    *   **Token Blacklist**: 引入 Redis 黑名单机制，解决 JWT 无状态注销问题。
    *   **Crypto Randomness**: 替换 `Math.random()` 为 `crypto.randomInt()`。
    *   **Rate Limiting**: 全局与认证接口限流 (`express-rate-limit`)。
    *   **Logout**: 修复退出登录漏洞，增加重定向白名单校验。
