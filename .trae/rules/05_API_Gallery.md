# API Specs (API 契约) - Gallery 服务篇

> **Status**: Active
> **Effective Date**: 2026-02-24
> **Enforcement**: 📝 **Stable (稳定)**

## 1. 相册服务 (Gallery Service) - V1.8.16
*   **前缀**: `/` (Nginx 直接反向代理，无 `/api` 前缀)。
*   **Auth**: 支持 App Secret 验证 (通过 `aud` 字段)。

### 1.1 图片管理
*   **GET** `/images`: 获取图片列表。
    *   Query: `category_id` (Optional)
*   **POST** `/images`: 上传/创建图片记录。
    *   Body: `{ title, file_url, file_path, width, height, category_id }`

### 1.2 分类管理
*   **GET** `/categories`: 获取分类列表。
*   **POST** `/categories`: 创建分类。
    *   Body: `{ name, color }`

### 1.3 用户引导
*   **GET** `/user/onboarding`: 获取用户引导状态 (目前 Mock 返回 `{completed: true}`)。
