# Account System 开发文档 (V1.6 重构版)

## 1. 封面

**项目名称**：Account System（IAM / SSO Platform）  
**版本号**：1.6 (Architecture Reconstruction)  
**发布日期**：2026-02-22  
**维护责任人**：Trae AI Assistant  
**状态**：**已修正 (Corrected)**  

---

## 2. 修订记录

| 版本 | 日期 | 修订人 | 修订原因 | 影响范围 |
| :--- | :--- | :--- | :--- | :--- |
| 1.0 - 1.4 | 2026-02 | Maintainer | 早期开发日志与功能迭代 | - |
| 1.5 | 2026-02-22 | Maintainer | 尝试 Nginx + PostgREST 方案 (已废弃) | 部署架构 |
| **1.6** | **2026-02-22** | **Trae** | **全局架构修正：确立四合院矩阵，废弃中间件容器，回归 Node.js + React 直连真实数据库** | **全文档重写** |

---

## 3. 核心定义：四合院项目矩阵

本项目（Account System）并非孤立存在，而是“四合院”生态的一部分。以下是各项目的明确定位：

| 项目代号 | 名称 | 定位 | 数据库 Schema | 职责与特征 |
| :--- | :--- | :--- | :--- | :--- |
| **项目 A** | **Account System** | **大门 / 管家 (基座)** | `public` | **生态基座**。负责用户登录、鉴权、SSO Token 签发。B/C/D 项目均无登录页，全靠 A 签发的通行证。 |
| **项目 B** | **Gallery (图库)** | **后花园** | `gallery` | **资产存储**。元数据存 DB，**原图存 Cloudflare R2** (img.iasbt.com)。强依赖 A 的 Token 访问。 |
| **项目 C** | **Toolbox** | **储藏室** | `toolbox` | 工具集集合。 |
| **项目 D** | **Life OS** | **主卧** | `life_os` | 个人生活管理系统。 |

---

## 4. 物理架构与数据流 (Physical Architecture)

### 4.1 部署拓扑
系统跨越三大基础设施，实现了计算与存储的分离：

1.  **数据库与大脑 (腾讯云 119.91.71.30)**
    *   **核心组件**: 唯一的 **PostgreSQL 实例 (容器名 `iasbt-postgres`, IP 172.17.0.3)**。
    *   **数据隔离**: 通过 Schema (`public`, `gallery`, etc.) 隔离业务数据。
    *   **数据关联**: B/C/D 表中的 `user_id` 严格外键关联至 A 项目的 `public.users`。
    *   **后端服务**: Node.js API 容器运行于此，直连数据库。

2.  **前端售楼部 (Vercel)**
    *   **组件**: Account System 前端 (React + Vite)。
    *   **特征**: 静态资源托管在边缘网络，访问极快。

3.  **静态仓库 (Cloudflare R2)**
    *   **组件**: 图库原图存储。
    *   **特征**: 零出口带宽费，通过 `img.iasbt.com` 提供访问。

### 4.2 核心运转逻辑 (The Flow)
**场景：用户查看一张照片**
1.  **认证**: 用户在 **Vercel (项目A前端)** 输入账号密码。
2.  **鉴权**: 请求发送至 **腾讯云 (项目A后端)** 验证，成功后签发 Token。
3.  **跳转**: 携带 Token 跳转至 **项目B (图库)**。
4.  **查询**: 图库后端使用 Token 向 **腾讯云 (Schema: gallery)** 查询照片元数据 (Path)。
5.  **加载**: 浏览器根据 Path 直接从 **Cloudflare R2** 加载真实图片。

---

## 5. 架构修正与部署方案 (Correction Plan)

**警告 (2026-02-22)**: 之前的部署脚本错误地启动了 `postgres-business`, `postgrest`, `nginx-gateway` 等空壳容器，导致系统分裂。以下方案用于**强制修正**。

### 5.1 第一步：环境清理 (cleanup.sh)
目标：清除所有错误容器，释放 80/443 端口。

```bash
#!/bin/bash
# 强制停止并删除废弃容器
docker rm -f postgres-business postgrest nginx-gateway 2>/dev/null || true
# 清理无用网络
docker network rm deploy_iasbt-net 2>/dev/null || true
# 释放端口占用
fuser -k 80/tcp 2>/dev/null || true
fuser -k 443/tcp 2>/dev/null || true
```

### 5.2 第二步：后端构建 (Dockerfile.api)
目标：构建 Node.js 后端，暴露 3000 端口。

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### 5.3 第三步：前端与网关构建
**Dockerfile.web** (多阶段构建):
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf** (SPA 支持 + API 代理):
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://account-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5.4 第四步：最终编排 (docker-compose.yml)
**关键原则**: 绝不创建新数据库，直连 `iasbt-postgres` (172.17.0.3)。

```yaml
version: '3.8'
services:
  account-backend:
    build:
      context: ../..
      dockerfile: deploy/correction/Dockerfile.api
    container_name: account-backend
    restart: always
    environment:
      - DB_HOST=172.17.0.3
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=public
      - PORT=3000
    ports:
      - "3000:3000"

  account-frontend:
    build:
      context: ../..
      dockerfile: deploy/correction/Dockerfile.web
    container_name: account-frontend
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - account-backend
```

---

## 6. 接口与数据规范

### 6.1 接口前缀
*   **API 接口**: `/api/*` (由 Nginx 转发至 Node.js 后端)
*   **静态资源**: `/*` (由 Nginx 直接响应)

### 6.2 数据库规范
*   **Schema 划分**: 严禁跨 Schema 直接 Join，必须通过应用层或视图聚合。
*   **外键策略**: 强外键约束。删除用户 (`public.users`) 时，需级联处理 (`ON DELETE CASCADE`) 或拒绝删除 (`RESTRICT`)，防止 B/C/D 产生孤儿数据。

---

## 7. 运维与交接 (Handover)

### 7.1 部署位置
所有修正文件位于服务器的 `/home/ubuntu/stack/deploy/correction` (上传后) 或本地 `c:\My_Project\account\deploy\correction`。

### 7.2 启动命令
```bash
# 1. 进入目录
cd deploy/correction

# 2. 清理旧环境
bash cleanup.sh

# 3. 启动新架构
docker compose up -d --build
```

### 7.3 验证清单
1.  `docker ps` 显示 `account-backend` 和 `account-frontend` 为 Up 状态。
2.  访问 `http://119.91.71.30` 能看到登录页。
3.  登录成功后，数据库 `public.session` 表有新记录。
