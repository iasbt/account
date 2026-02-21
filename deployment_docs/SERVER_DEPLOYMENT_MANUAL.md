# 2026 服务器全栈部署实战手册

> **文档版本**: v1.1
> **更新时间**: 2026-02-11
> **服务器 IP**: 119.91.71.30 (腾讯云 Ubuntu 22.04)
> **部署状态**: ✅ 成功 (All Services Running)
> **维护责任人**: Trae AI Assistant

---

## 1. 部署架构概览

本次部署采用 **“候鸟式”全 Docker 架构**，所有配置和数据封装在 `/home/ubuntu/stack` 目录下，支持一键迁移。

| 服务组件 | 容器名称 | 端口映射 | 版本 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **Postgres** | `postgres-business` | 5432 (内部) | 15 | 业务数据库 |
| **PostgREST** | `postgrest` | 3000 (内部) | latest | API 数据访问层 |
| **MT Photos** | `mt-photos` | 8063 (内部) | latest | 轻量级相册服务 |
| **Nginx Gateway** | `nginx-gateway` | 80:80, 443:443 | alpine | 统一网关，负责反向代理 |

**网络拓扑**：
- **公网入口**: 腾讯云 EdgeOne (CDN/WAF) -> 服务器 Nginx (80端口)
- **内部转发**: Nginx -> (Docker Network) -> MT Photos / PostgREST
- **SSL/HTTPS**: 由 EdgeOne 托管证书，回源协议为 **HTTP**。

---

## 2. 核心访问地址

| 服务 | 网址 | 备注 |
| :--- | :--- | :--- |
| **相册 (Gallery)** | [http://iasbt.cloud](http://iasbt.cloud) | 已统一域名，上传无限制 |
| **门户 (Portal)** | [http://www.iasbt.cloud](http://www.iasbt.cloud) | (规划中) |

---

## 3. 自动化部署脚本 (`deploy_to_remote.ps1`)

脚本位置: `c:\My_Project\account\deploy_to_remote.ps1`

### 3.1 功能详解
此脚本是部署的核心，执行以下原子操作：
1.  **SSH 连接**: 使用 `D:\OneDrive\Desktop\trae.pem` 密钥连接服务器。
2.  **冲突清洗**:
    *   **强制停止**并**删除**旧的 `nginx-proxy-app-1` 容器 (解决 80/443 端口占用)。
    *   清理 `nginx-gateway`, `postgrest`, `postgres-business` 等旧容器，确保“全新启动”。
3.  **密码保护**:
    *   自动检测 `.env` 是否存在。**注意**：为了防止数据库重新初始化导致数据丢失，脚本目前硬编码了已知的服务器数据库密码 (`8plYGAfmtW79aDXL`)。
4.  **文件同步**: 将本地 `deploy/` 目录全量上传至 `/home/ubuntu/stack`。
5.  **服务编排**: 执行 `docker compose up -d` 启动所有服务。

### 3.2 常用运维命令
在 VSCode 终端中运行：

```powershell
# 1. 一键部署 (慎用，会重启服务)
.\deploy_to_remote.ps1

# 2. 查看所有容器状态
ssh -i "D:\OneDrive\Desktop\trae.pem" ubuntu@119.91.71.30 "sudo docker ps"
```

---

## 4. 故障排查与修复记录 (Log)

### [2026-02-11] 关键修复记录

#### 1. Nginx 端口冲突 (Bind 443 failed)
*   **现象**: Nginx 容器无法启动。
*   **原因**: 服务器上残留了之前部署的 `nginx-proxy-manager`。
*   **修复**: 更新 `deploy_to_remote.ps1`，添加前置清理逻辑：
    ```bash
    sudo docker stop nginx-proxy-app-1 ... || true
    sudo docker rm nginx-proxy-app-1 ... || true
    ```

---

## 5. 后续配置清单 (To-Do)

### 5.1 腾讯云 EdgeOne 配置
由于服务器 Nginx 监听 80 端口，必须调整 EdgeOne 回源策略：
- [ ] 进入 EdgeOne 控制台 -> `iasbt.cloud`。
- [ ] **DNS 解析**：添加 `*.iasbt.cloud` CNAME 指向 EdgeOne。
- [ ] **回源配置**：将 **回源协议 (Origin Protocol)** 设置为 **HTTP** (重要！否则 502)。

## 6. 备份与迁移
*   **备份**: 运行服务器上的 `bash /home/ubuntu/stack/backup.sh`，数据会自动打包上传至 Bitiful S3。
*   **恢复**: 在新服务器下载备份包解压，运行 `docker compose up -d` 即可。
