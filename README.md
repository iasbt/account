# Account System (IAM / SSO) - V1.6

> **Status**: 🔒 Frozen / Sealed (V1.6)
> **Docs**: [ACCOUNT_SYSTEM_DEV_DOC_V1.6.md](deployment_docs/ACCOUNT_SYSTEM_DEV_DOC_V1.6.md)

统一账户中心，作为“四合院”项目矩阵的数字基座，负责统一身份认证 (SSO)、权限控制 (RBAC) 和数据中台服务。

## 技术栈 (Tech Stack)

### Core
- **Database**: PostgreSQL 14 (Alpine) - *Single Source of Truth*
- **Backend**: Node.js 18 (Express) - *RESTful API*
- **Frontend**: React 18 + Vite + TypeScript - *SPA*
- **Gateway**: Nginx (Alpine) - *Reverse Proxy & Static Server*

### Infrastructure
- **Orchestration**: Docker Compose (V2)
- **Deployment**: PowerShell Automation (`deploy_remote.ps1`)
- **Cloud**: Tencent Cloud (Ubuntu)

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
1. Git Push (Local -> GitHub)
2. SSH Pull (GitHub -> Tencent Cloud)
3. Docker Build & Restart
4. Health Check Verification (`/api/health`)

**详情请参阅**: [开发文档 V1.6](deployment_docs/ACCOUNT_SYSTEM_DEV_DOC_V1.6.md)

## 目录结构 (Directory Structure)

- `src/`: 前端源代码
- `deploy/correction/`: **部署核心配置 (Docker/Nginx)** - *Do not modify without approval*
- `deployment_docs/`: 详细架构文档
- `server.js`: 后端入口文件
- `deploy_remote.ps1`: 自动化部署脚本

## 变更日志 (Changelog)
详细变更记录请查看: [CHANGELOG.md](CHANGELOG.md)
