# 安全评估报告与整改路线图 (Security Assessment Report & Roadmap)

> **日期**: 2026-02-27
> **范围**: 账号系统 (后端与认证模块)
> **状态**: 整改已完成 (Phase 1 实施完毕)

## 1. 执行摘要 (Executive Summary)

我们对账号系统进行了全面的安全评估，采用了静态代码分析、动态渗透测试和依赖组件扫描等手段。评估识别出了内容安全策略 (CSP)、密钥管理和暴力破解防护方面的关键漏洞。

**关键成果**:
- **修复了 3 个严重 (P0) 漏洞**: CSP 强制执行、生产环境密钥验证、以及速率限制。
- **实施了 2 个主要 (P1) 功能**: 基于数据库的审计日志和基于 Redis 的暴力破解锁定。
- **验证**: 所有修复措施均已通过自动化动态渗透测试 (`scripts/security_audit.js`) 验证。

## 2. 评估方法 (Methodology)

1.  **静态应用安全测试 (SAST)**:
    -   对 `app.js`, `config/index.js`, 和 `authController.js` 进行人工代码审查。
    -   审查 `helmet`, `cors`, 和 `express-rate-limit` 的配置。
2.  **动态应用安全测试 (DAST)**:
    -   使用自定义渗透脚本 (`security_audit.js`) 模拟 SQL 注入、XSS 和暴力破解攻击。
    -   进行负载测试以验证速率限制。
3.  **依赖组件扫描**:
    -   分析 `package.json` 以查找过时或有风险的包 (例如 `zod` v4 alpha)。

## 3. 发现与整改 (Findings & Remediation)

### 3.1 内容安全策略 (CSP) - 🔴 严重 (Critical)
-   **问题**: Helmet 配置中显式禁用了 CSP (`contentSecurityPolicy: false`)，使应用暴露于跨站脚本 (XSS) 攻击风险中。
-   **整改**: 启用了严格的 CSP，仅允许必要的源 (`'self'`, `*.iasbt.com`, `localhost`)。
-   **状态**: ✅ **已修复** (`app.js`)。

### 3.2 密钥管理 - 🔴 严重 (Critical)
-   **问题**: 如果环境变量中缺少 `SSO_JWT_SECRET`，系统会默认使用空字符串或弱值，可能导致令牌伪造。
-   **整改**: 在 `config/index.js` 中添加了严格检查，如果生产环境中缺少 `SSO_JWT_SECRET`，将抛出致命错误并停止启动。
-   **状态**: ✅ **已修复**。

### 3.3 暴力破解防护 - 🟠 高危 (High)
-   **问题**: 不存在账号锁定机制。攻击者可以在全局速率限制 (300次/分钟) 内无限次猜测密码。
-   **整改**: 实施了 `utils/accountLock.js` (基于 Redis，支持内存回退)。
    -   **策略**: 在 **5 次失败尝试** 后锁定账号 **15 分钟**。
    -   **审计**: 将失败事件记录在 Prometheus (`auth_failures_total`) 和数据库中。
-   **状态**: ✅ **已实施并验证**。

### 3.4 速率限制 - 🟠 高危 (High)
-   **问题**: 敏感认证端点的全局速率限制过于宽松。
-   **整改**: 在 `middlewares/rateLimit.js` 中将 `authLimiter` 窗口减少到 **60 次请求/分钟**。
-   **状态**: ✅ **已修复**。

### 3.5 审计日志 - 🟡 中危 (Medium)
-   **问题**: 缺乏持久化的安全日志，导致事后取证困难。
-   **整改**:
    -   创建了 `security_logs` 表 (PostgreSQL)。
    -   实现了 `auditLogger.js` 服务。
    -   将日志集成到 `登录`, `注册`, `SSO`, 和 `登出` 流程中。
-   **状态**: ✅ **已实施**。

## 4. 竞品对标 (Competitor Benchmarking)

我们分析了 **Keycloak**, **Casdoor**, 和 **Authelia** 以提取最佳实践：

| 功能特性 | Trae Account (新) | Keycloak | Casdoor | Authelia |
| :--- | :--- | :--- | :--- | :--- |
| **暴力破解** | ✅ 锁定 (Redis) | ✅ 锁定 | ✅ 锁定 | ✅ 封禁 IP |
| **审计日志** | ✅ 数据库表 | ✅ 管理事件 | ✅ 数据库表 | ✅ 文件/Syslog |
| **CSP** | ✅ 严格 | ✅ 严格 | ✅ 可配置 | ✅ 严格 |
| **MFA/2FA** | ❌ 计划中 (P2) | ✅ 原生 | ✅ 原生 | ✅ 原生 |

**采纳方案**:
-   采纳 **Casdoor 风格** 的表结构审计日志，便于未来通过 Admin UI 查询。
-   采纳 **Keycloak 风格** 的临时账号锁定 (相对于 Authelia 的 IP 封禁)，以防止针对特定用户的攻击。

## 5. 验证结果 (Verification Results)

动态渗透测试脚本 (`node scripts/security_audit.js`) 确认：
1.  **SQL 注入**: 被拦截 (服务器返回 429/400，无绕过)。
2.  **速率限制**: 在第 61 次请求时触发。
3.  **锁定**: 5 次失败尝试后账号被锁定 (错误信息: "账号已被锁定")。
4.  **审计日志**: 确认已插入 `LOGIN_FAIL` 和 `LOGIN_SUCCESS` 事件。

## 6. 未来路线图 (P2 - 下一步)

1.  **MFA/TOTP 实现**: 为管理员账号添加基于时间的一次性密码支持。
2.  **管理后台**: 开发前端 UI 以可视化 `security_logs` 并管理被锁定的账号。
3.  **Zod 版本锁定**: 将 `zod` 降级到稳定的 v3.x 或验证 v4 的生产就绪状态。
4.  **Prometheus 集成**: 为 `auth_failures_total` 创建 Grafana 仪表盘。

---
*本报告由 Trae AI 安全助手生成*
