# API Specs (API 契约) - Email 服务篇

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 邮件服务 (Email Service) - V1.8.4
*   **GET** `/api/admin/email/providers`: 获取所有邮件服务商配置。
*   **POST** `/api/admin/email/providers`: 创建新服务商。
*   **POST** `/api/admin/email/providers/:id/enable`: 启用指定服务商。
*   **GET** `/api/admin/email/templates`: 获取邮件模板列表。
*   **PUT** `/api/admin/email/templates/:type`: 更新特定类型模板。
    *   Body: `{ subject, content, variables }`
*   **GET** `/api/admin/email/logs`: 获取邮件发送日志。
    *   Query: `page`, `limit`
*   **GET** `/api/admin/email/stats`: 获取邮件发送统计 (含 24h 趋势)。
    *   Response: `{ total_sent, success_rate, trend: [{ hour, count }] }`
