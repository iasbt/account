# 账户系统 (Account System) - V2.0

> **Status**: ✅ Active (V1.8.6)
> **Docs**: [📚 Documentation Index (文档索引)](docs/INDEX.md)

统一账户中心，作为“四合院”项目矩阵的数字基座，负责统一身份认证 (SSO)、权限控制 (RBAC) 和数据中台服务。

## 最新特性 (New Features v2.0)
- **纯 JWT 架构 (Pure JWT)**: 彻底移除 Supabase 依赖，采用标准 RFC 7519 JWT 机制。
- **安全加固 (Security Hardening)**: 全面引入 Zod 输入验证、Rate Limiting 频率限制与 XSS 防护。
- **架构重构 (Architecture)**: 认证逻辑下沉至 Service 层，数据库迁移至标准 `users` 表。
- **多应用 SSO (Multi-App SSO)**: 支持 Gallery, Toolbox 等子应用接入，提供动态 Token 生成策略。
- **可视化管理 (Visual Admin)**: 管理员后台新增“应用接入”模块，无需修改代码即可一键添加新应用。
- **动态注册表 (Dynamic Registry)**: 应用配置存储于数据库，支持热更新与独立密钥管理。
- **邮件服务 V2 (Email Service V2)**: 全新重构的邮件系统，支持多服务商切换、可视化模板编辑、发送日志审计及实时统计图表 (Recharts)。

## 文档导航 (Documentation)

请访问 [**docs/INDEX.md**](docs/INDEX.md) 查看完整文档库。

### 核心文档
- **架构设计**: [01_系统概览.md](docs/01_架构设计/01_系统概览.md)
- **开发指南**: [01_子系统接入手册.md](docs/02_开发指南/01_子系统接入手册.md)
- **API 参考**: [03_API接口规范.yaml](docs/03_参考手册/03_API接口规范.yaml)
- **部署运维**: [01_部署手册.md](docs/04_部署运维/01_部署手册.md)

## 技术栈 (Tech Stack)

### 核心组件 (Core)
- **数据库**: PostgreSQL 14 (Alpine) - *唯一真理来源 (Single Source of Truth)*
- **后端**: Node.js 20 (Express) - *RESTful API & Email Worker*
- **前端**: React 19 + Vite + TypeScript + Zustand - *SPA 与状态管理*
- **网关**: Nginx (Alpine) - *反向代理与静态服务*
- **缓存/队列**: Redis (Alpine) - *BullMQ 邮件队列*

### 基础设施 (Infrastructure)
- **编排**: Docker Compose (V2)
- **部署**: PowerShell 自动化 (`deploy_remote.ps1`)
- **云服务**: 腾讯云 (Ubuntu)

## 快速开始 (Quick Start)

### 1. 环境准备
- Node.js 18+
- Docker & Docker Compose

### 2. 安装依赖
```bash
npm install
```

### 3. 本地开发 (Local Dev)
```bash
# 启动前端 (5173)
npm run dev

# 启动后端 (3000)
node server.js
```

## 部署 (Deployment)

**唯一指定部署脚本**:
```powershell
.\deploy_remote.ps1 "Commit Message"
```

此脚本将自动执行：
1. Git 推送 (本地 -> GitHub)
2. SSH 拉取 (GitHub -> 腾讯云)
3. Docker 构建与重启
4. 健康检查验证 (`/api/health`)

**详情请参阅**: [01_部署手册.md](docs/04_部署运维/01_部署手册.md)

## 目录结构 (Directory Structure)

- `src/`: 前端源代码
    - `pages/`: 页面组件 (含 `AdminPanel`, `DashboardPage`)
    - `store/`: Zustand 状态管理
- `controllers/`: 后端业务逻辑 (`adminController`, `authController`)
- `middlewares/`: 中间件 (`roleCheck`, `cors`)
- `routes/`: 路由定义
- `deploy/correction/`: **部署核心配置 (Docker/Nginx)** - *未经批准严禁修改*
- `docs/`: 项目文档库 (V2.0 结构)
    - `01_架构设计/`: 架构设计与系统白皮书
    - `02_开发指南/`: 开发指南与接入集成手册
    - `03_参考手册/`: 配置模板与 API 规范
    - `04_部署运维/`: 部署运维与测试策略
    - `99_归档中心/`: 历史归档与废弃文档
- `server.js`: 后端入口文件
- `deploy_remote.ps1`: 自动化部署脚本

## 变更日志 (Changelog)
详细变更记录请查看: [CHANGELOG.md](CHANGELOG.md)
