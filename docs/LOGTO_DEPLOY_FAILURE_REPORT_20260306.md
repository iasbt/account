# Logto 远程部署故障诊断报告 (2026-03-06)

> **报告 ID**: RPT-20260306-LOGTO-FAIL
> **状态**: 🔴 阻断 (Blocker)
> **受影响服务**: Logto Identity Service
> **环境**: Production (Remote: 119.91.71.30)
> **报告人**: Trae AI Assistant

## 1. 执行摘要 (Executive Summary)

在执行 Logto 身份认证服务的远程部署过程中，部署流程在“数据库初始化与变更（Database Alteration）”阶段发生致命错误，导致服务无法正常启动。

尽管 Portainer 监控显示 `logto-core` 容器处于 `Running` 状态，且 `logto-postgres` 处于 `Healthy` 状态，但应用层实际上并未完成初始化，无法对外提供服务。

核心故障原因为 **数据库脏数据（Dirty Data）** 导致的模式不一致（Schema Mismatch）。此问题由于初次部署中断遗留了部分数据库表结构，而后续的清理命令因 SSH 远程执行的语法转义问题未能成功清除旧数据，导致 Logto 的数据库迁移脚本在重试时陷入死锁循环。

---

## 2. 故障表现 (Fault Manifestation)

### 2.1 部署控制台报错
在执行 `deploy-logto.sh remote` 脚本的“启动 PostgreSQL 并执行数据库变更”阶段，捕获到以下关键堆栈信息：

```text
> alteration
> logto db alt deploy 1.37.1

info Deploy target 1.37.1
info Found 227 alterations to deploy
error error: type "application_type" does not exist
    at .../pg/lib/client.js:526:17
    ...
    code: '42704',
    file: 'parse_type.c',
    line: '270',
    routine: 'typenameType'
fatal Error occurred while running alteration 1.0.0_beta.10-1663923211-machine-to-machine-app.js.
```

该错误 `code: '42704'` (PostgreSQL Error Code) 明确指出 SQL 执行过程中引用了一个不存在的类型 `application_type`。

### 2.2 Portainer 状态快照
根据现场环境数据，各容器状态如下：

| 容器名称 | 状态 | IP 地址 | 端口映射 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| `logto-core` | **Running** | - | - | 端口绑定在 127.0.0.1，外部不可见，符合隔离设计。但应用层初始化失败。 |
| `logto-postgres` | **Healthy** | 172.24.0.2 | - | 数据库服务运行正常，但内部数据已损坏（Schema 不完整）。 |
| `account-backend` | Running | 172.23.0.6 | 3000:3000 | 现有账户服务运行正常，未受影响。 |
| `iasbt-postgres` | Running | 172.17.0.3 | 5432:5432 | 现有数据库运行正常，未受影响。 |

**观察结论**：
1.  **隔离有效**：Logto 成功运行在独立的网段 (`172.24.x.x`)，未与现有账户服务 (`172.23.x.x`) 混用，验证了 `docker-compose.yml` 中网络隔离配置的有效性。
2.  **状态误导**：Docker 容器的 `Running` 状态掩盖了应用内部的崩溃。Logto 主进程可能正在不断重启或处于 CrashLoopBackOff 之前的短暂存活期。

---

## 3. 根本原因分析 (Root Cause Analysis)

### 3.1 核心原因：数据库状态“中间态”
Logto 的数据库初始化逻辑（基于 Slonik 迁移工具）并非完全幂等（Idempotent）。它的工作逻辑如下：
1.  **检查库是否为空**：若为空，执行全量 Seed（创建所有表、类型、默认数据）。
2.  **检查版本号**：若不为空，检查 `logto_version` 表，决定是否执行 Alteration 脚本进行升级。

**故障场景复现**：
1.  **第一次部署**：脚本启动了 PostgreSQL，开始初始化。但在创建完部分表结构后，可能由于网络超时、脚本中断或手动停止，导致初始化过程中止。此时数据库中存在部分表，但缺少 `application_type` 这个自定义枚举类型（ENUM）。
2.  **第二次部署**：Logto 检测到数据库非空（因为有上次遗留的表），因此跳过了“全量 Seed”步骤，直接尝试运行 Alteration 脚本。
3.  **冲突发生**：Alteration 脚本 `1.0.0_beta.10...` 试图修改或使用 `application_type`，但因为第一次初始化未完成，该类型并不存在。PostgreSQL 抛出 `type does not exist` 错误，部署终止。

### 3.2 次要原因：远程清理命令失效
为了解决上述问题，我们尝试执行“核弹级”清理命令：
```bash
ssh ... "cd ... && sudo docker compose down && sudo docker run ... rm -rf /data/postgres/*"
```
**失败原因**：
Windows PowerShell -> OpenSSH -> Remote Bash 的多层调用导致了严重的 **引号转义灾难 (Quoting Hell)**。
日志显示：
```text
/bin/bash: -c: line 1: syntax error near unexpected token `('
```
这意味着 `rm -rf` 命令根本没有执行。数据库文件保留在服务器磁盘上的 `./logto-data/postgres` 目录中。因此，即使我们重启了容器，PostgreSQL 挂载的依然是那份损坏的“脏数据”。

---

## 4. 技术深挖 (Technical Deep Dive)

### 4.1 为什么 Logto 不自动修复？
现代 ORM 或迁移工具通常假设数据库处于“已知状态”（要么是空，要么是某个确定的旧版本）。“部分初始化”的状态是未定义的行为（Undefined Behavior）。Logto 的 CLI 工具没有内置“检测并修复损坏 Schema”的高级功能，这在无状态服务设计中是常见的——数据的完整性由持久化层负责，应用层只负责读写。

### 4.2 部署脚本的架构缺陷
当前的 `deploy-logto.sh` 采用了“本地编排，远程执行”的模式，即在本地机器上拼接一长串命令发送给服务器。
*   **优点**：服务器端零依赖，无需在服务器上维护脚本文件。
*   **缺点**：当命令复杂度增加（涉及管道、重定向、引号、通配符）时，极易出错。

**改进方向**：应采用“上传脚本 -> 远程执行脚本”的模式。即先 `scp deploy-logto.sh` 到服务器，然后在服务器上运行 `bash deploy-logto.sh`。这样可以彻底规避转义问题。

---

## 5. 修复与行动计划 (Remediation Plan)

为了彻底解决该问题，必须打破“脏数据循环”。建议按以下步骤操作：

### 步骤 1: 手动彻底清理 (The "Nuke" Option)
由于远程单行命令不可靠，我们需要分步执行清理，确保“尸骨无存”。

1.  **停止所有 Logto 容器**：确保没有进程占用数据库文件。
2.  **物理删除数据卷**：直接在服务器文件系统层面删除 `./logto-data` 目录。
3.  **修剪 Docker 资源**：清除可能残留的匿名卷或网络。

### 步骤 2: 修正部署逻辑
修改 `deploy-logto.sh`，不再依赖脆弱的单行 SSH 命令。

*   **方案 A (当前采用)**: 优化 SSH 命令的转义逻辑，使用 Base64 编码传输命令（虽然复杂但可靠），或者简化命令结构。
*   **方案 B (推荐)**: 将清理逻辑封装为函数，在部署前强制检查：如果检测到是 `first_run` 或者用户请求 `force_reinstall`，则自动执行清理。

### 步骤 3: 验证部署
清理完成后，再次运行部署。此时：
1.  PostgreSQL 启动为空库。
2.  Logto 检测到空库，执行全量 Seed。
3.  `application_type` 被正确创建。
4.  后续 Alteration 脚本基于正确的基础结构运行，部署成功。

---

## 6. 总结
本次故障并非软件缺陷，而是典型的**部署流水线（Deployment Pipeline）异常处理不当**。
它揭示了在自动化部署中，“环境一致性”的重要性。当环境（数据库）处于未知状态时，自动化脚本必须具备“识别并复位”的能力，或者至少能准确报错并停止，而不是盲目重试。

当前的当务之急是：**手动介入，清理现场，重置状态。**
一旦数据库回归纯净状态，部署脚本即可顺利通过。
