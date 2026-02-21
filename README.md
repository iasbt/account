# Account System (IAM / SSO)

统一账户中心，负责登录、权限控制与子应用单点登录回跳。

## 技术栈 (Tech Stack)

### Frontend
- **Framework**: React + Vite + TypeScript
- **Routing**: React Router v7
- **State**: Zustand
- **UI**: TailwindCSS

### Backend & Infrastructure
- **Database**: MySQL 8.0 (Managed by Docker)
- **Gateway**: Nginx (Reverse Proxy)
- **Storage**: Bitiful S3 (Backups)
- **Deployment**: Docker Compose ("Migratory Bird" Architecture)

## 快速开始 (Quick Start)

### 1. 环境准备
确保本地已安装 Node.js 20+ 和 Docker (可选，用于本地调试后端)。

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录创建 `.env`：

```bash
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. 启动开发服务器
```bash
npm run dev
```

## 部署与运维 (Deployment)

服务器部署详情请参考: [SERVER_DEPLOYMENT_MANUAL.md](deployment_docs/SERVER_DEPLOYMENT_MANUAL.md)

### 常用运维命令
```bash
# 部署到生产环境 (需配置 SSH Key)
.\deploy_to_remote.ps1

# 本地构建
npm run build
```

## 目录结构
- `src/`: 前端源代码
- `deploy/`: 服务器部署配置 (Docker Compose, Nginx)
- `deployment_docs/`: 详细部署与集成文档
- `deploy_to_remote.ps1`: 自动化部署脚本

## 变更日志 (Changelog)
详细变更记录请查看: [CHANGELOG.md](CHANGELOG.md)
