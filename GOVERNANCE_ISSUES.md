# 治理问题追踪 (Governance Issues)

## ISSUE-001: ESLint JSX 解析配置缺失
- **优先级**: P0 (阻塞)
- **类型**: Bug / Configuration
- **描述**: `eslint` 无法解析 `packages/sdk/src/client.jsx`，原因是 `.jsx` 缺少 `parserOptions.ecmaFeatures.jsx = true`。
- **影响范围**: 代码扫描失败，SDK 组件无法被检测。
- **复现步骤**: 运行 `npm run lint`。
- **日志/截图**: `Parsing error: Unexpected token <`。
- **责任人**: Trae AI
- **Story Point**: 2
- **验收标准**: `eslint .` 0 errors / 0 warnings。
- **状态**: 已关闭

## ISSUE-002: 未使用变量过多
- **优先级**: P2 (中)
- **类型**: Code Smell / Technical Debt
- **描述**: 多处 `no-unused-vars`，包含未使用的导入、变量与 `catch` 参数。
- **影响范围**: 可读性下降，隐藏错误易被忽略。
- **复现步骤**: 运行 `npm run lint`。
- **日志/截图**: `no-unused-vars` 警告列表。
- **责任人**: Trae AI
- **Story Point**: 3
- **验收标准**: 清理无用变量并统一 `_` 前缀策略。
- **状态**: 已关闭

## ISSUE-003: SDK 构建链路未接入
- **优先级**: P3 (低)
- **类型**: Enhancement
- **描述**: `packages/sdk` 未明确纳入构建与测试脚本。
- **影响范围**: SDK 变更可能不受 CI 约束。
- **复现步骤**: 运行 `npm run build`，确认是否包含 SDK 产物。
- **日志/截图**: 无。
- **责任人**: Trae AI
- **Story Point**: 2
- **验收标准**: CI 明确覆盖 SDK 产物或给出排除说明。
- **状态**: 进行中

## ISSUE-004: 安全/依赖扫描工具未接入
- **优先级**: P1 (高)
- **类型**: Security / Compliance
- **描述**: SonarQube、Snyk、OWASP Dependency-Check 未配置执行入口。
- **影响范围**: 无法输出 SARIF/JSON 安全报告。
- **复现步骤**: 查找 `sonar-project.properties` 或相关脚本。
- **日志/截图**: 未发现配置文件。
- **责任人**: Trae AI
- **Story Point**: 5
- **验收标准**: 提供可运行的扫描命令与报告输出路径。
- **状态**: 待处理

## ISSUE-005: 性能剖析链路未接入
- **优先级**: P2 (中)
- **类型**: Performance / Observability
- **描述**: perf、async-profiler、JProfiler、Lighthouse 未接入。
- **影响范围**: 关键性能指标无法量化对比。
- **复现步骤**: 查找性能脚本或 CI 配置。
- **日志/截图**: 未发现相关脚本。
- **责任人**: Trae AI
- **Story Point**: 5
- **验收标准**: 至少输出一次基线性能报告。
- **状态**: 待处理

## ISSUE-006: 复杂度检测链路未接入
- **优先级**: P2 (中)
- **类型**: Quality / Maintainability
- **描述**: lizard、radon、typhonio 未接入。
- **影响范围**: 复杂度与可维护性无法量化。
- **复现步骤**: 查找复杂度扫描脚本。
- **日志/截图**: 未发现相关配置。
- **责任人**: Trae AI
- **Story Point**: 3
- **验收标准**: 输出函数级复杂度报告。
- **状态**: 待处理

## ISSUE-007: 单元测试日志噪音
- **优先级**: P3 (低)
- **类型**: Test / Logging
- **描述**: `auth-login` 测试中输出 `[AuditLogger] Failed to log event`。
- **影响范围**: CI 日志噪音，影响问题定位。
- **复现步骤**: 运行 `npm run test`。
- **日志/截图**: `[AuditLogger] Failed to log event LOGIN_SUCCESS...`
- **责任人**: Trae AI
- **Story Point**: 1
- **验收标准**: 通过 Mock 或测试开关消除噪音输出。
- **状态**: 已关闭

## ISSUE-008: 集成测试依赖未就绪导致失败
- **优先级**: P2 (中)
- **类型**: Test / Environment
- **描述**: `test:coverage` 在未启动 Postgres/Redis 时失败。
- **影响范围**: 覆盖率流水线被阻断。
- **复现步骤**: 未启动 Docker 直接运行 `npm run test:coverage`。
- **日志/截图**: `ECONNREFUSED 127.0.0.1:5433/6380`。
- **责任人**: Trae AI
- **Story Point**: 2
- **验收标准**: 通过开关控制集成测试是否执行。
- **状态**: 已关闭
