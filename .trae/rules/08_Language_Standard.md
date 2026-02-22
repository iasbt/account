# Language & Localization Standards (语言与本地化规范)

> **Status (状态)**: 🛡️ **Enforced (强制执行)**
> **Language (语言)**: Simplified Chinese (简体中文)

## 1. Documentation Language (文档语言)
*   **Rule (规则)**: 所有项目文档、注释及提交信息必须主要使用 **简体中文** 撰写。
*   **Purpose (目的)**: 确保团队成员能够准确、快速地理解核心逻辑与约束。

## 2. Bilingual Terminology (双语术语)
*   **Requirement (要求)**: 专有名词、技术术语、关键概念首次出现或作为标题时，建议采用 **中英双语** 对照形式。
*   **Format (格式)**: `Chinese Term (English Term)` 或 `English Term (中文解释)`。
*   **Examples (示例)**:
    *   `Path Absolutization (路径绝对化)`
    *   `Deployment Atomicity (部署原子化)`
    *   `Layered Architecture (分层架构)`

## 3. Code & Paths (代码与路径)
*   **Exception (例外)**: 代码变量名、文件路径、API 路由、Docker 容器名等必须保持 **英文**，严禁使用中文。
*   **Reference (引用)**: 在文档中引用代码实体时，应直接使用其英文名称，并在必要时补充中文说明。
