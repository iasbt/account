# 应用接入代码位置清单 (App Access Code Map)

本文档列出“应用接入”相关代码在本项目中的具体位置，便于快速定位前后端实现与数据库表结构。

## 1. 后端接口与路由 (Backend APIs & Routes)

- 应用接入路由定义（`/apps`，管理员鉴权）
  - [appRoutes.js](file:///c:/My_Project/account/routes/appRoutes.js#L1-L19)
  - 说明：所有 `/apps` 路由统一绑定 `requireAuth` 与 `requireAdmin`，包含 CRUD 接口。
- 路由挂载入口（`/apps` 挂载在根路由）
  - [index.js](file:///c:/My_Project/account/routes/index.js#L1-L21)
  - 说明：`router.use("/apps", appRoutes)` 使 `/api/apps` 生效（Nginx 重写后为 `/apps`）。
- 应用接入控制器（CRUD 逻辑）
  - [appController.js](file:///c:/My_Project/account/controllers/appController.js#L1-L95)
  - 说明：`createApp / getApps / getApp / updateApp / deleteApp` 对应应用的新增、查询、更新、删除。

## 2. SSO 与应用注册表 (SSO & Application Registry)

- SSO 发放 Token 时从应用注册表匹配应用
  - [ssoController.js](file:///c:/My_Project/account/controllers/ssoController.js#L8-L113)
  - 说明：根据 `public.applications` 表的 `allowed_origins` 匹配应用并选择 Token 生成策略。
- 旧配置兼容（静态应用配置）
  - [apps.js](file:///c:/My_Project/account/config/apps.js#L1-L76)
  - 说明：历史阶段的静态配置表，当前保留用于兼容与迁移参考。

## 3. 前端管理界面 (Admin UI)

- 管理后台入口与“应用接入”Tab
  - [AdminPanel.tsx](file:///c:/My_Project/account/src/pages/AdminPanel.tsx#L1-L106)
  - 说明：左侧导航中包含“应用接入”入口，并加载 `AppManager` 组件。
- 应用接入管理组件（列表/创建/编辑/删除）
  - [AppManager.tsx](file:///c:/My_Project/account/src/components/admin/AppManager.tsx#L1-L120)
  - 说明：应用列表、弹窗表单、密钥生成与复制逻辑均在此实现。
- 应用接入 API 服务层
  - [appService.ts](file:///c:/My_Project/account/src/services/appService.ts#L1-L52)
  - 说明：封装 `/apps` 的 CRUD 调用，供 `AppManager` 使用。

## 4. 数据结构与初始化 (Database Schema)

- 应用接入表定义（历史结构参考）
  - [database.sql](file:///c:/My_Project/account/deployment_docs/attachments/database.sql#L1-L32)
  - 说明：包含 `applications` 与 `user_app_access` 的基础结构定义（历史文档参考）。
- 应用表初始化与种子数据
  - [init_apps_table.js](file:///c:/My_Project/account/scripts/init_apps_table.js#L1-L63)
  - 说明：创建 `public.applications` 表并从 `config/apps.js` 生成初始化数据。

## 5. 相关说明与使用指引 (Reference Docs)

- 可视化应用接入说明
  - [ACCOUNT_GALLERY_SSO_INTEGRATION_GUIDE.md](file:///c:/My_Project/account/log/ACCOUNT_GALLERY_SSO_INTEGRATION_GUIDE.md#L26-L87)
  - 说明：描述如何在管理员后台注册新应用与配置子应用环境变量。
