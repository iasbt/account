# Project Health Report (项目技术体检报告 V1.6.5)

> **日期**: 2026-02-22  
> **范围**: 现有功能稳定性维护与无价值代码/资源清理  
> **说明**: 本次不做代码改动，仅输出体检报告与方案

> **归档声明**: 本文档已不再使用，仅供历史追溯。

## 0. 执行摘要

*   **整体健康评分**: **73 / 100**
*   **主要结论**: 代码质量基线稳定（Lint/Typecheck/Test 均通过），但存在高危依赖漏洞、开放重定向风险、覆盖率不足和大量历史脚本/文档“野文件”堆积问题。
*   **重点治理方向**: 安全漏洞收敛、依赖升级、清理非生产脚本与产物、引入覆盖率统计与性能基准。

## 1. 扫描工具与结果

### 1.1 已执行工具
*   **ESLint**: `npm run lint` ✅ 0 errors / 0 warnings  
*   **TypeScript**: `npm run typecheck` ✅ 0 errors  
*   **Vitest**: `npm run test` ✅ 1 文件 / 9 用例通过  
*   **npm audit**: 高危 10 / 中危 1 / 低危 0 / 严重 0  
*   **npm outdated**: 多个依赖存在 minor/major 版本落后

### 1.2 未配置工具（需后续补齐）
*   **SonarQube**: 未发现 `sonar-project.properties` 或 scanner 配置  
*   **Snyk**: 未发现配置或 token  
*   **OWASP Dependency-Check**: 未配置报告输出

## 2. 模块健康评分

| 模块 | 评分 | 说明 |
| :--- | :--- | :--- |
| 前端 (React/Vite) | 74 | 结构清晰，重定向风险与测试不足拖分 |
| 后端 (Express) | 72 | 业务逻辑可用，但安全/性能细节待补强 |
| 部署与运维 | 68 | 脚本较多，存在历史遗留与“野文件”堆叠 |
| 文档与记录 | 78 | 资料齐全但冗余较多，需要分层归档 |
| 测试与质量保障 | 60 | 仅 1 个测试文件，缺少覆盖率指标 |

## 3. 严重度问题清单

### 3.1 致命 (P0)
*   **无**（当前未发现会导致系统立即不可用的漏洞）

### 3.2 严重 (P1)
1. **开放重定向风险**  
   - 位置: [LoginPage.tsx:L15-L33](file:///C:/My_Project/account/src/pages/LoginPage.tsx#L15-L33)  
   - 描述: 登录后直接使用 `from/redirect` 跳转，未做白名单或同源校验  
   - 影响: 可被利用进行钓鱼跳转  

2. **高危依赖漏洞集中于工具链**  
   - 来源: `npm audit`  
   - 影响: 供应链风险，构建环境可被攻击

### 3.3 一般 (P2)
1. **Dashboard 统计查询串行**  
   - 位置: [dashboardController.js:L3-L23](file:///C:/My_Project/account/controllers/dashboardController.js#L3-L23)  
   - 描述: 多个查询串行执行，延迟可被放大  

2. **明文密码兼容逻辑**  
   - 位置: [authController.js:L124-L129](file:///C:/My_Project/account/controllers/authController.js#L124-L129)  
   - 描述: 允许非 bcrypt 格式密码直接比对  
   - 影响: 遗留数据存在弱安全配置风险

### 3.4 轻微 (P3)
*   **大量一次性脚本与历史文档**堆积  
*   **覆盖率缺失**，缺少真实比例指标  
*   **依赖版本落后**，需规划升级路径

## 4. 技术债务量化评估

*   **安全债务**: 2 项高风险（开放重定向、依赖漏洞链）  
*   **质量债务**: 覆盖率缺失 + 复杂业务未测  
*   **运维债务**: 迁移/导出脚本、备份脚本散落且未归档  
*   **估算债务指数**: **中高**

## 5. 依赖健康检查

### 5.1 高危漏洞（来自 npm audit）
*   `eslint` / `typescript-eslint` / `minimatch` 链路存在高危漏洞  
*   建议优先升级至 `eslint@10.x` 与最新 `typescript-eslint` 兼容版本  

### 5.2 过时依赖（来自 npm outdated）
*   `eslint`: 9.39.2 → 10.0.1 (大版本升级)  
*   `tailwindcss`: 3.4.17 → 4.2.0 (大版本升级)  
*   `@types/node`: 24.x → 25.x (大版本升级)  
*   其余依赖多数为 minor 更新

### 5.3 潜在未使用依赖（需确认）
*   `mysql2`: 当前代码中无引用  
*   `node-fetch`: 仅用于 `test.js`、`verify_cors.js`  
*   建议先确认脚本是否仍需保留，再决定移除/迁移到 devDependencies

## 6. 性能与瓶颈诊断

### 6.1 现状
*   无性能分析工具配置（APM/Profiler/K6 未接入）  
*   多处数据库查询为串行执行，存在优化空间  

### 6.2 基准测试现状
*   **现状**: 未执行  
*   **建议基准脚本**: [k6_login_order_pay.js](file:///C:/My_Project/account/deployment_docs/attachments/k6_login_order_pay.js)

## 7. 安全漏洞扫描

*   **依赖漏洞**: 已由 `npm audit` 覆盖  
*   **Snyk / OWASP**: 未配置，需要后续补齐  
*   **代码风险点**: 开放重定向与明文密码兼容（详见第 3 节）

## 8. 代码覆盖率评估

*   当前仅 1 个测试文件: [rbac.test.ts](file:///C:/My_Project/account/src/lib/rbac.test.ts)  
*   未覆盖模块: 登录/注册流程、API 服务层、路由守卫  
*   覆盖率指标: **暂无工具输出**，建议启用 `vitest --coverage`

## 9. 无价值文件/功能清理建议

### 9.1 建议保留（业务/运维价值明确）
*   `LOG/` 全部历史开发记录与修复记录  
*   `deployment_docs/` 架构与部署资料  

### 9.2 建议归档或确认后清理（需先备份）
*   `deploy.zip`, `directory_tree.txt`（生成产物/快照）  
*   `ACCOUNT_HEALTH_REPORT.md`, `ACCOUNT_HEALTH_REPORT.pdf`（旧版报告）  
*   `test.js`, `verify_cors.js`（一次性脚本）  
*   `direct-export.js`, `final-bulk-import.js`, `rebuild-structure.js`, `setup-db.js`, `inspect-db.js`, `set-password.js`（迁移/导出脚本）  
*   `dashboard.html`（疑似遗留静态页）

### 9.3 野文件提示（基于白名单规则）
*   当前根目录与 `docs/`、`LOG/` 存在大量未在白名单中的文件  
*   **处理原则**: 先归档到明确目录并保留版本记录，再考虑删除

## 10. 优化方案（含代码示例）

### 10.1 开放重定向修复
**方案**: 仅允许同源路径或白名单域名跳转  

```ts
const url = new URL(from, window.location.origin)
const allowedOrigins = [window.location.origin]
if (allowedOrigins.includes(url.origin)) {
  window.location.href = url.toString()
} else {
  navigate('/')
}
```

**回归测试**  
*   登录后携带合法路径跳转成功  
*   登录后携带外部域名被拦截  

### 10.2 串行查询优化
**方案**: 使用并行查询减少延迟  

```js
const [imageCountResult, latestImagesResult, userResult] = await Promise.all([
  pool.query("SELECT COUNT(*)::bigint AS count FROM gallery.images"),
  pool.query(`SELECT title, file_path FROM gallery.images ORDER BY created_at DESC NULLS LAST LIMIT 5`),
  pool.query("SELECT id, email, username FROM public.legacy_users WHERE email = $1 LIMIT 1", ["iasbt@outlook.com"])
])
```

**回归测试**  
*   /api/dashboard 响应结构不变  
*   多次请求无异常

### 10.3 密码安全强化
**方案**: 仅允许 bcrypt 哈希，淘汰明文兼容  

```js
if (!hash.startsWith("$2")) {
  return res.status(400).json({ message: "密码格式异常", success: false })
}
const isValid = await bcryptjs.compare(password, hash)
```

**回归测试**  
*   正常用户登录成功  
*   遗留明文账号被提示修复  

### 10.4 依赖升级路径
**优先路径**  
1. 升级 eslint → 10.x（修复高危依赖链）  
2. 同步升级 typescript-eslint  
3. tailwindcss 4.x 单独评估  

**回归测试**  
*   `npm run lint`  
*   `npm run typecheck`  
*   `npm run test`  
*   `npm run build`

## 11. 分阶段实施计划

### 第一阶段：紧急修复（1-2 周）
*   修复开放重定向  
*   升级 eslint/typescript-eslint  
*   产物/脚本清理前完成归档与备份

### 第二阶段：性能优化（3-4 周）
*   增加性能基准（K6）  
*   优化串行查询  
*   引入慢查询日志

### 第三阶段：代码重构（1-2 月）
*   引入覆盖率统计  
*   拆分大型逻辑并补齐测试  
*   建立“脚本归档区”

## 12. 清理的备份与回滚方案

*   **备份**: 清理前归档到 `LOG/ARCHIVE/` 或新建 `archive/` 目录，并做 Git tag  
*   **回滚**: 通过 Git tag 或归档包恢复  
*   **校验**: 清理后执行 `npm run lint`、`npm run test`、`npm run build`

