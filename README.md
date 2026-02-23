# Account System (IAM / SSO) - V1.7.6

> **Status**: ✅ Active (V1.7.6)
> **Docs**: [ACCOUNT_SYSTEM_DEV_DOC_V1.6.md](deployment_docs/ACCOUNT_SYSTEM_DEV_DOC_V1.6.md)

统一账户中心，作为“四合院”项目矩阵的数字基座，负责统一身份认证 (SSO)、权限控制 (RBAC) 和数据中台服务。

## 技术栈 (Tech Stack)

### 核心组件 (Core)
- **数据库**: PostgreSQL 14 (Alpine) - *唯一真理来源 (Single Source of Truth)*
- **后端**: Node.js 20 (Express) - *RESTful API*
- **前端**: React 19 + Vite + TypeScript + Zustand - *SPA 与状态管理*
- **网关**: Nginx (Alpine) - *反向代理与静态服务*

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

**详情请参阅**: [开发文档 V1.6](deployment_docs/ACCOUNT_SYSTEM_DEV_DOC_V1.6.md)

## 目录结构 (Directory Structure)

- `src/`: 前端源代码
    - `pages/`: 页面组件 (含 `AdminPanel`, `DashboardPage`)
    - `store/`: Zustand 状态管理
- `controllers/`: 后端业务逻辑 (`adminController`, `authController`)
- `middlewares/`: 中间件 (`roleCheck`, `cors`)
- `routes/`: 路由定义
- `deploy/correction/`: **部署核心配置 (Docker/Nginx)** - *未经批准严禁修改*
- `deployment_docs/`: 详细架构文档
- `server.js`: 后端入口文件
- `deploy_remote.ps1`: 自动化部署脚本

## 变更日志 (Changelog)
详细变更记录请查看: [CHANGELOG.md](CHANGELOG.md)
