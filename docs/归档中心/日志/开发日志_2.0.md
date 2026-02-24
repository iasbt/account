# Account System - 新开发与维护方向日志 (PM 视角版)

> 状态: 已归档
> 归档时间: 2026-02-09
> 归档责任人: Account Maintainer

> 版本: v2.0.0  
> 更新日期: 2026-02-09  
> 适用对象: 新开发者 / 产品负责人 / 维护人员  
> 目标: 基于当前代码与历史演进，形成新的开发与维护方向

---

## 1. 项目定位与价值主张

Account System 是 Life OS 生态的统一身份中心，承担注册登录、权限控制、Token 发放与 SSO 跳转。它的价值不在于单点功能，而在于为所有子应用提供稳定一致的身份底座。

**核心价值**  
- 统一身份入口，减少各子应用重复开发  
- 提升用户登录体验与跨应用无感跳转  
- 通过 RBAC 管理权限与运营安全  

---

## 2. 现状快照（基于现有代码）

**当前入口与路由**  
- 应用入口使用 [main.tsx](file:///C:/My_Project/account/src/main.tsx)  
- 主路由为 [App.tsx](file:///C:/My_Project/account/src/App.tsx)  
- Admin 路由受 [AdminGuard.tsx](file:///C:/My_Project/account/src/components/auth/AdminGuard.tsx) 保护  

**关键页面**  
- 用户侧：登录与应用启动台 [DashboardPage](file:///C:/My_Project/account/src/pages/DashboardPage.tsx)  
- 管理侧：用户与应用管理 [ApplicationsPage](file:///C:/My_Project/account/src/pages/admin/ApplicationsPage.tsx)、[UsersPage](file:///C:/My_Project/account/src/pages/admin/UsersPage.tsx)  

**核心状态与逻辑**  
- 全局 Auth 状态： [useAuthStore.ts](file:///C:/My_Project/account/src/store/useAuthStore.ts)  
- Supabase 客户端： [supabase.ts](file:///C:/My_Project/account/src/lib/supabase.ts)  
- SSO 登录： [LoginForm.tsx](file:///C:/My_Project/account/src/features/auth/components/LoginForm.tsx)  

**数据库与表结构（来自既有文档与类型）**  
- profiles：用户角色与基础信息  
- applications：子应用接入配置  
- user_app_access：用户访问记录  

---

## 3. 关键业务链路（产品视角）

**链路 A：用户登录与鉴权**  
1. 用户进入 /login  
2. 登录成功后进入 /  
3. useAuthStore 初始化 session 与 profiles  
4. 角色为 admin 的用户可访问 /admin  

**链路 B：子应用接入与 SSO**  
1. 子应用使用 /login?redirect=xxx 跳转  
2. 登录成功后回跳至外部应用  
3. 应用启动台提供应用列表与入口  

**链路 C：管理员运营**  
1. 管理员通过 /admin 管理应用与用户  
2. 手动修改 profiles.role 完成权限提升  

---

## 4. 产品经理视角的开发与维护方向

### 4.1 近期目标
- 入口标准统一：仅保留 App.tsx 路由体系，确保 /login、/、/admin 路由对齐  
- 登录与回跳一致：登录后优先使用来源跳转，若无来源回到启动台  
- 未授权提示闭环：AdminGuard 拒绝访问后统一给出提示与回退路径  
- SSO 回跳安全：白名单校验与回跳链接格式统一，前后端示例一致  
- 应用接入流程完善：Applications 页面内置接入片段、配置示例与最小校验  
- 权限模型对齐：profiles.role 作为唯一权限源，前端守卫与后端字段一致  
- 类型与表结构一致性：database.types.ts 与数据库字段逐项对齐并补齐缺失项  
- 最小审计闭环：应用访问日志写入 user_app_access 并可追踪用户  
- 运维流程固化：Auth 逻辑变更必须更新 APP_VERSION 并触发 Auto-Detox  

### 4.2 中期目标
- 形成角色矩阵与授权策略（RBAC 可配置化）  
- 管理员授权流程化（操作记录与可回溯）  
- 增强用户中心能力（邮箱绑定、头像、访问记录）  
- 子应用接入状态可视化（接入信息、回跳验证、在线状态）  
- 应用与用户维度的访问统计与趋势  
- 关键字段与错误码规范化，便于前端统一提示  

### 4.3 长期目标
- 提供统一的身份 SDK 或回调模板  
- 构建权限审计与风控能力  
- 支持多租户与组织级管理  
- 统一身份与应用的运营指标看板  

---

## 5. 维护要点与风险

**维护要点**  
- Auth 逻辑变更后需更新 APP_VERSION  
- Admin 入口保持隐藏，防止暴露管理面  
- Supabase RLS 与触发器必须完整执行  

**主要风险**  
- 类型定义与数据库字段存在不一致  
- 文档与入口实现可能出现偏差  
- 无测试体系，回归风险不可控  

---

## 6. 关键缺口与待办清单

- user_app_access 表字段在代码中使用 app_id，但类型定义仍为 application_id  
- README 与项目定位仍需与文档统一  
- 需要补充测试流程或最小可回归脚本  
- 缺少子应用接入校验或自动化模板  

---

## 7. 运维与协作规范

- 修改权限逻辑必须同步 APP_VERSION  
- 管理员通过数据库手动提升  
- 遇到登录死循环优先执行 Auto-Detox  
- 合并前须通过 lint 与 build  

---

## 8. 版本记录

- v2.0.0：以 PM 视角重新定义开发与维护方向，补齐产品路线与缺口清单
