# “候鸟式”全栈部署与迁移指南 (2025版)

> **核心理念**：针对您“每年更换便宜服务器”的需求，本方案采用 **“数据与逻辑彻底分离”** 的架构。
> **目标**：新服务器到手后，执行一条命令即可 100% 还原旧服务器的所有服务和数据。

---

## 1. 临时过渡策略 (未来 60 天)

鉴于 `iasbt.com` 处于转出锁定期，无法备案，我们采取 **“双域名并行”** 策略：

| 服务 | 临时域名 (前 60 天) | 最终域名 (60 天后) | 部署位置 | CDN 策略 |
| :--- | :--- | :--- | :--- | :--- |
| **SSO 认证** | `account.iasbt.cloud` | `account.iasbt.com` | 腾讯云服务器 | **EdgeOne** (绑定 .cloud) |
| **相册** | `gallery.iasbt.cloud` | `gallery.iasbt.cloud` | 腾讯云服务器 | **EdgeOne** (绑定 .cloud) |
| **博客** | `blog.iasbt.com` | `blog.iasbt.com` | **Cloudflare Pages** | Cloudflare CDN (境外) |
| **门户** | `www.iasbt.cloud` | `www.iasbt.com` | 腾讯云服务器 | **EdgeOne** (绑定 .cloud) |

**EdgeOne 配置建议**：
*   直接绑定 `iasbt.cloud` 整个域名。
*   配置 CNAME：`*.iasbt.cloud` -> EdgeOne 提供的 CNAME。
*   这样 `account`, `gallery`, `www` 等子域名都能享受国内加速和防护。

---

## 2. “拎包入住”的文件结构

在服务器上，我们只维护 **一个文件夹**（例如 `/home/ubuntu/stack`）。所有的数据、配置、脚本都在这里。

```text
/home/ubuntu/stack
├── docker-compose.yml      # 核心编排文件
├── .env                    # 密码和环境变量
├── backup.sh               # 一键备份脚本
├── restore.sh              # 一键恢复脚本
├── data/                   # 【核心数据】(自动生成，需备份)
│   ├── mysql/              # 数据库文件
│   ├── casdoor/            # 认证中心配置
│   ├── nginx/              # 网关配置与证书
│   └── gallery/            # 相册缩略图等
└── backups/                # 本地备份归档
```

---

## 3. 核心 Docker Compose 配置

见项目中的 `deploy/docker-compose.yml`。
**特点**：
1.  **绝对路径解耦**：所有路径都使用相对路径 `./data/...`，不管你把文件夹拷到哪里都能跑。
2.  **网络隔离**：内部互通，只暴露 Nginx 的 80/443 端口。

---

## 4. “一键跑路”备份方案 (Backup)

我们编写了一个 `backup.sh` 脚本，它会做三件事：
1.  **热备份数据库**：使用 `mysqldump` 导出 SQL 文件（比直接拷贝 /var/lib/mysql 更安全，跨版本兼容性更好）。
2.  **打包文件**：将 `./data` 目录（排除临时文件）打包成 `.tar.gz`。
3.  **上传云端**：自动上传到 **缤纷云 (Bitiful) S3**，确保服务器挂了数据也在。

**使用方法**：
```bash
# 手动备份
bash backup.sh

# 自动备份 (Crontab) - 每天凌晨 3 点
0 3 * * * cd /home/ubuntu/stack && bash backup.sh >> backup.log 2>&1
```

---

## 5. “一键复活”迁移方案 (Restore)

当您买了明年的新服务器后：

1.  **环境准备**：
    ```bash
    # 安装 Docker
    curl -fsSL https://get.docker.com | bash
    ```

2.  **数据拉取**：
    *   从 Bitiful 下载最新的 `backup_YYYYMMDD.tar.gz`。
    *   解压到 `/home/ubuntu/stack`。

3.  **启动服务**：
    ```bash
    cd stack
    bash restore.sh
    ```

**`restore.sh` 会自动执行**：
1.  解压数据目录。
2.  启动 MySQL 容器。
3.  导入 SQL 数据。
4.  启动其余所有服务。

---

## 6. 博客的特殊处理 (Blog)

由于博客是纯静态的，且您希望它“挂在外面”：
1.  **代码托管**：将 Hexo 源码推送到 GitHub 私有仓库。
2.  **自动构建**：使用 **Cloudflare Pages** (推荐) 或 **Vercel** 连接该 GitHub 仓库。
3.  **域名绑定**：在 Cloudflare Pages 后台绑定 `blog.iasbt.com`。
4.  **优势**：
    *   **完全免费**。
    *   **自带 CDN**：虽然在国内比不上 EdgeOne，但对于博客阅读足够了。
    *   **无需备案**：因为服务器不在国内。
    *   **无需迁移**：服务器换了，博客不受任何影响。

---

## 总结

通过这套方案，您的核心资产（数据库、相册、配置）都被封装在 `stack` 文件夹中，并每日自动同步到 S3。
**每年的迁移工作量将从“几天”缩减为“15分钟”。**
