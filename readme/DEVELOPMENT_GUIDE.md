# 开发指南（DEVELOPMENT_GUIDE）

> 文档版本：1.9.17  
> 最后更新：2026-03-06

## 1. 本地环境

- Node.js：20.x
- 包管理：npm
- 数据库：PostgreSQL 14
- 推荐系统：Windows PowerShell / Linux Bash

## 2. 启动与常用命令

```bash
npm install
npm run dev
npm run server
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:coverage
```

## 3. 代码结构速览

- 前端：`src/pages`、`src/store`、`src/services`、`src/types`
- 后端：`routes`、`controllers`、`services`、`middlewares`、`utils`
- 测试：`tests/unit`、`tests/integration`、`src/lib/*.test.ts`

## 4. 代码质量标准（强制）

- 命名规范：
  - 变量/函数：语义化英文命名
  - 组件：PascalCase
  - 常量：UPPER_SNAKE_CASE
- 格式规范：
  - ESLint 全量通过
  - TypeScript 类型检查通过
- 注释规范：
  - 仅对复杂边界、协议约束、非直观逻辑补充说明
  - 不写无信息增量注释

## 5. 提交流程与评审门禁

1. 本地先通过：
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
2. 提交 PR
3. CI 自动校验静态分析与测试
4. 至少 1 位同事完成评审后才能合并

## 6. 测试策略（功能完整性）

- 单元测试：覆盖核心工具与服务逻辑
- 集成测试：覆盖路由 + 控制器 + 服务联动
- 端到端测试：覆盖登录、管理员操作、关键业务链路
- 目标：
  - 新增功能必须同时提供测试
  - 修复缺陷必须补回归用例
  - 覆盖率持续提升并纳入里程碑验收

## 7. 调试建议

- 鉴权问题：先看请求头 Bearer Token，再看 `requireAuth/requireAdmin`
- 管理员权限问题：核对 `users.is_admin` 与 `admin_accounts`
- OIDC 问题：检查 `/.well-known/*` 与验签算法配置
- Logto 对接问题：核对 `LOGTO_ISSUER`、`LOGTO_JWKS_URL`、`LOGTO_AUDIENCE` 与实际租户配置

## 8. 里程碑交付物要求

每个里程碑必须产出完整交付包：

- 可部署代码
- 更新后的技术文档
- 测试报告（单元/集成/E2E）
- 性能分析报告（基准与压力）
- 风险清单与回滚方案

## 9. 配置参考总册

- 全量配置说明请优先阅读：`readme/CONFIGURATION_GUIDE.md`
