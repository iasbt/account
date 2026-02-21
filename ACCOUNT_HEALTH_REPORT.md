# Account 项目全方位体检报告（静态分析）

生成时间：2026-02-22  
扫描范围：`src/`、`deploy/`、顶层配置与脚本  
报告版本：v1

## 执行摘要
- 当前代码以前端为主，认证服务处于“未配置”状态，导致登录/注册链路不可用，属于高风险功能缺失。
- 存在可被滥用的跳转漏洞与部署脚本硬编码敏感信息，需优先修复。
- 依赖安全审计存在 10 个高危、1 个中危，主要集中在 ESLint 与 typescript-eslint 工具链。
- 测试覆盖极低，仅有 1 个 RBAC 单测文件，关键页面与认证逻辑未被覆盖。

## 扫描工具与方法
已执行：
- ESLint（`npm run lint -- --format json`）
- TypeScript 构建类型检查（`npm run typecheck`）
- Vitest 测试（`npm run test`）
- npm audit 依赖漏洞扫描（`npm audit --json`）

未执行（原因）：
- SonarQube：仓库未配置 scanner 与服务器连接信息
- PMD / FindBugs：Java 工具，当前代码库为 TypeScript/React

## 代码结构概览
- 入口与路由：[main.tsx](file:///C:/My_Project/account/src/main.tsx), [App.tsx](file:///C:/My_Project/account/src/App.tsx)
- 认证状态： [useAuthStore.ts](file:///C:/My_Project/account/src/store/useAuthStore.ts)
- 页面层：`src/pages/*`
- API 工具： [api.ts](file:///C:/My_Project/account/src/lib/api.ts)
- 部署脚本与编排： [deploy_to_remote.ps1](file:///C:/My_Project/account/deploy_to_remote.ps1), [docker-compose.yml](file:///C:/My_Project/account/deploy/docker-compose.yml)

## 核心问题清单（含行号、严重度与建议）
| 严重度 | 类别 | 位置 | 问题描述 | 修复建议 |
| --- | --- | --- | --- | --- |
| 高 | 安全 | [LoginPage.tsx:L15-L33](file:///C:/My_Project/account/src/pages/LoginPage.tsx#L15-L33) | 直接使用 `from/redirect` 参数进行跳转，存在开放重定向 | 加入白名单校验或仅允许同源路径，拒绝外部域名 |
| 高 | 安全 | [deploy_to_remote.ps1:L30-L69](file:///C:/My_Project/account/deploy_to_remote.ps1#L30-L69) | 部署脚本硬编码数据库密码，且 `StrictHostKeyChecking=no` | 改为读取安全密钥（如环境变量/密钥管理），开启主机指纹校验 |
| 高 | 可用性 | [useAuthStore.ts:L26-L39](file:///C:/My_Project/account/src/store/useAuthStore.ts#L26-L39) | 登录/注册/验证码接口统一抛出“认证服务未配置”，导致全链路不可用 | 接入新的认证后端或在 UI 上禁用登录与注册入口 |
| 中 | 安全 | [docker-compose.yml:L15-L36](file:///C:/My_Project/account/deploy/docker-compose.yml#L15-L36) | Postgres 与 PostgREST 端口直接暴露，生产环境易被探测 | 仅在内网开放或通过防火墙限制来源 |
| 中 | 运维 | [docker-compose.yml:L34-L36](file:///C:/My_Project/account/deploy/docker-compose.yml#L34-L36) | API 代理地址硬编码公网 IP | 使用环境变量注入，避免迁移时遗留 |
| 低 | 可维护性 | [api.ts:L32-L36](file:///C:/My_Project/account/src/lib/api.ts#L32-L36) | 鉴权头部尚未实现 | 接入认证后统一注入 Token |

## 高严重度告警人工复核
- 开放重定向：确认可由外部 `redirect` 参数控制 `window.location.href`，不存在任何白名单校验，属于真实漏洞。  
  影响：可被钓鱼或绕过预期登录回跳策略。
- 部署脚本硬编码密码：确认敏感信息直接写入脚本，且 host key 校验被关闭。  
  影响：容易被误提交、泄漏或遭到中间人攻击。

## 质量与可维护性指标（近似统计）
统计口径：仅 `src/`，基于文本启发式（非 AST 精确解析）。

**总体指标**
- 文件数：11
- 总行数：1130
- 注释覆盖率：4.42%
- 行级重复率（近似）：39.91%
- 平均文件圈复杂度（估算）：4.27

**Top 5 最大文件**
- RegisterPage.tsx：250 行，复杂度 10
- ProfilePage.tsx：198 行，复杂度 4
- DashboardPage.tsx：161 行，复杂度 3
- LoginPage.tsx：120 行，复杂度 3
- App.tsx：81 行，复杂度 3

**Top 5 最长函数（近似）**
- LoginPage.handleLogin：48 行（[LoginPage.tsx:L15-L62](file:///C:/My_Project/account/src/pages/LoginPage.tsx#L15-L62)）
- App 路由渲染：47 行（[App.tsx:L34-L80](file:///C:/My_Project/account/src/App.tsx#L34-L80)）
- RegisterPage.handleSubmit：38 行（[RegisterPage.tsx:L62-L99](file:///C:/My_Project/account/src/pages/RegisterPage.tsx#L62-L99)）
- apiFetch：26 行（[api.ts:L24-L49](file:///C:/My_Project/account/src/lib/api.ts#L24-L49)）
- LoginPage state 初始化：25 行（[LoginPage.tsx:L15-L39](file:///C:/My_Project/account/src/pages/LoginPage.tsx#L15-L39)）

**可视化图表（ASCII）**
```
注释覆盖率  4.42%  █░░░░░░░░░
重复率     39.91%  ████████░░
平均复杂度  4.27   ███░░░░░░░
```

## 测试覆盖率与未覆盖分支
现有测试：
- [rbac.test.ts](file:///C:/My_Project/account/src/lib/rbac.test.ts)（9 个用例）

未覆盖模块（代表性）：
- 认证与状态管理： [useAuthStore.ts](file:///C:/My_Project/account/src/store/useAuthStore.ts)
- 登录/注册页面： [LoginPage.tsx](file:///C:/My_Project/account/src/pages/LoginPage.tsx), [RegisterPage.tsx](file:///C:/My_Project/account/src/pages/RegisterPage.tsx)
- API 封装： [api.ts](file:///C:/My_Project/account/src/lib/api.ts)
- 路由与权限守卫： [App.tsx](file:///C:/My_Project/account/src/App.tsx)

说明：当前测试未开启覆盖率统计插件，无法获得真实覆盖率百分比。

## 依赖风险与升级路径（npm audit）
审计结果：高危 10、中危 1、低危 0、严重 0。主要集中在开发工具链（ESLint/TypeScript ESLint）。

**建议升级路径**
- eslint：升级至 10.0.1 或更高版本
- typescript-eslint：升级至最新稳定版以消除解析链漏洞
- minimatch：由 eslint 更新链路间接修复

## 编码规范与一致性
- ESLint 扫描无违规项（0 errors / 0 warnings）。
- 建议补充：鉴权头实现（[api.ts](file:///C:/My_Project/account/src/lib/api.ts#L32-L36)），并统一处理 API 错误格式。

## 文档完整性评估
发现不一致：
- README 描述数据库为 MySQL，但部署编排使用 Postgres（[README.md](file:///C:/My_Project/account/README.md), [docker-compose.yml](file:///C:/My_Project/account/deploy/docker-compose.yml)）。
- 部分文档仍提及 Supabase 体系，但代码层已改为本地 PostgREST/PG。

## 可扩展性评估
- 认证与用户体系未接入后端，阻塞注册登录拓展。
- API 层缺少统一 Token 注入与错误映射，未来扩展多后端会产生重复工作。
- 业务配置（IP、端口）硬编码较多，不利于环境迁移。

## 风险矩阵
| 风险 | 影响 | 可能性 | 等级 |
| --- | --- | --- | --- |
| 开放重定向 | 高 | 高 | 高 |
| 硬编码密码 + 关闭主机校验 | 高 | 中 | 高 |
| 认证服务未配置 | 高 | 高 | 高 |
| 数据库端口暴露 | 中 | 中 | 中 |

## 修复优先级排序（建议负责人）
1. 安全整改：开放重定向与部署脚本敏感信息（安全负责人 / 运维负责人）
2. 认证链路恢复：接入新认证后端或禁用入口（前端负责人）
3. 依赖升级：ESLint/TypeScript ESLint（工具链负责人）
4. 测试补齐：认证/路由/API 覆盖（QA + 前端负责人）
5. 文档一致性修正（文档维护人）

## 工作量级别（替代时间估算）
- 安全整改：中
- 认证链路恢复：高
- 依赖升级：中
- 测试补齐：中
- 文档一致性：低

## 附：扫描输出摘要
- ESLint：0 问题
- TypeScript：0 问题
- Vitest：1 个测试文件通过
- npm audit：11 个漏洞（10 高危、1 中危）
