# 账户系统开发计划 (Account System Development Plan)

> **状态**: Active
> **最后更新**: 2026-02-26
> **当前阶段**: Phase 3 - 多应用集成 (Multi-App Integration)

## 🎯 项目目标
构建一个统一的账户中心 (Account System)，作为所有子应用 (Gallery, Toolbox, Life OS) 的唯一身份认证源 (SSO Identity Provider)。

## 📅 阶段规划

### ✅ Phase 1: 基础设施建设 (Completed)
- [x] **核心架构**: Node.js + Express + PostgreSQL (v1.6.x)
- [x] **前端重构**: React + Vite + Tailwind (v1.6.x)
- [x] **部署流程**: 自动化部署脚本 (`deploy_remote.ps1`)
- [x] **文档体系**: 双语规范、架构文档、API 契约
- [x] **管理员门户**: 用户管理、应用注册表 (v1.8.x)

### 🚀 Phase 2: 图库集成 (Gallery Integration) - In Progress
> **目标**: 将现有的图库项目接入账户系统，替代 Supabase Auth。
- [x] **SSO 协议设计**: 基于 Hash Fragment 的 Token 传递机制 (v1.8.0)
- [x] **跨域跳转支持**: 修复 `LoginPage` 以支持 IP 访问和 `http://119.91.71.30:5173` (v1.8.8)
- [x] **文档更新**: 移除了域名引用，全面转向 IP 访问配置 (v1.8.8)
- [x] **配置同步**: 更新数据库 `applications` 表，添加多端口 IP 白名单 (v1.8.8)
- [ ] **集成验证**:
    - [ ] 用户验证从图库跳转登录并自动返回。
    - [ ] 验证 Token 在图库端的解析与会话建立。
- [ ] **资源存储**: 接入 Cloudflare R2 (待定/未来)

### ⏳ Phase 3: 工具箱与生活系统 (Toolbox & Life OS) - Pending
> **目标**: 开发并接入剩余的子应用。
- [ ] **Toolbox 初始化**:
    - [ ] 创建项目脚手架。
    - [ ] 接入 Account SSO (复用 Gallery 模式)。
- [ ] **Life OS 初始化**:
    - [ ] 创建项目脚手架。
    - [ ] 接入 Account SSO。

### 🔮 Phase 4: 未来展望 (Future)
- [ ] **多因素认证 (MFA)**: 提高安全性。
- [ ] **RBAC 增强**: 细粒度的权限控制。
- [ ] **审计日志**: 记录所有关键操作。
- [ ] **监控系统**: 接入 APM 和日志聚合。

## 📝 当前任务 (Current Tasks)
1.  **验证 SSO**: 等待用户反馈图库登录跳转是否正常。
2.  **维护**: 监控 `v1.8.8` 版本的稳定性。
3.  **规划**: 准备 Toolbox 的开发环境。

## 🐛 已知问题与修复 (Known Issues & Fixes)
- **SSO Redirect**: 修复了跨域重定向被拦截的问题 (Fixed in v1.8.8)。
- **Domain**: 修正了 `gallery.iasbt.com` -> `img.iasbt.com` (Fixed in v1.8.8).
- **Dashboard**: 修复了统计数据加载问题 (Fixed in v1.8.7).
