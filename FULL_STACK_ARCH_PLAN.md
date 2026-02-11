# 个人全栈项目综合实施计划书 (2025版)

## 1. 核心建议与总体架构

**结论先行**：您的 4核 4G 服务器完全足以支撑这套架构（SSO + 博客 + 相册），但需要精细化编排。**将 `iasbt.com` 转回腾讯云是极其正确的决定**，这是国内合规运营的基石。

### 1.1 资源分配预估 (4C 4G)
我们采用 **全 Docker 化部署**，利用 Nginx 进行反向代理和静态资源托管，以节省内存。

| 服务组件 | 角色 | 预计内存 | 技术选型 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx** | 网关/静态服务器 | 50MB | Nginx (Docker) | 统一入口，HTTPS 终结，Hexo 托管 |
| **Casdoor** | 统一认证中心 | 100MB | Go | 接管所有登录 |
| **MySQL** | 核心数据库 | 500MB | MySQL 8.0 | Casdoor 和其他业务共用 |
| **Gallery App**| 相册应用 | 500MB-1G | 自研/PhotoPrism | 配合 S3 存储 |
| **Account** | 统一门户 | 静态 | React Build | Nginx 托管静态文件 |
| **Hexo** | 博客 | 静态 | Static HTML | Nginx 托管静态文件 |
| **Redis** | 缓存 (可选) | 100MB | Redis | 提升 Session 性能 |
| **剩余** | 系统预留 | ~2GB | OS | 应对突发流量 |

### 1.2 域名规划
*   `iasbt.com` (主域/腾讯云):
    *   `www.iasbt.com` -> 个人主页/导航 (建议指向 Account 项目)
    *   `account.iasbt.com` -> SSO 认证页 (Casdoor)
    *   `blog.iasbt.com` -> Hexo 博客
*   `iasbt.cloud` (相册域/腾讯云):
    *   `@` / `www` -> 相册应用 (通过 Nginx 转发)

---

## 2. 第一阶段：合规与基础设施 (预计 7-20 天)

这是最耗时的一步，建议**立即行动**。

### 2.1 域名转入与备案
1.  **域名转入**：在腾讯云控制台申请 `iasbt.com` 转入。
    *   *注意*：Cloudflare 解锁域名并获取转移密码。转入过程通常需要 5-7 天。
2.  **ICP 备案**：
    *   **主体**：个人。
    *   **网站名称**：避开“博客”、“论坛”、“登录”、“平台”等字眼。建议使用“个人技术笔记”、“生活记录小站”。
    *   **备注**：明确说明是“不涉及交互的个人技术文章分享”。
    *   **服务器要求**：您的腾讯云服务器剩余时长需 > 3 个月。
3.  **公安联网备案**：ICP 备案通过后 30 天内，需在“全国互联网安全管理服务平台”进行公安备案（流程较快，纯线上）。

### 2.2 基础环境初始化
在等待备案期间，配置服务器环境。
```bash
# 1. 安装 Docker & Compose (您已完成)

# 2. 创建统一网络 (让所有容器互通)
docker network create iasbt-net

# 3. 目录结构规划 (建议)
/data
  ├── cdn-assets/      # 存放一些通用的静态资源
  ├── mysql/           # 数据库挂载
  ├── nginx/
  │   ├── conf.d/      # 站点配置
  │   └── certs/       # SSL 证书
  ├── casdoor/         # 认证中心配置
  ├── hexo/            # 博客静态文件 (通过 git hook 自动部署到这里)
  └── gallery/         # 相册配置
```

---

## 3. 第二阶段：核心服务部署 (SSO + 网关)

### 3.1 统一 Docker Compose 编排
建议在 `/data` 下创建一个 `docker-compose.yml` 管理所有核心后端服务。

```yaml
version: '3'
services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./mysql:/var/lib/mysql
    networks:
      - iasbt-net

  casdoor:
    image: casbin/casdoor:latest
    container_name: casdoor
    restart: always
    environment:
      driverName: mysql
      dataSourceName: root:${DB_PASSWORD}@tcp(mysql:3306)/
      dbName: casdoor
    depends_on:
      - mysql
    networks:
      - iasbt-net

  # 您的 Account 项目 (门户)
  # 建议构建为静态文件由 Nginx 托管，这里仅作示意
  
  nginx:
    image: nginx:alpine
    container_name: nginx-gateway
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/certs:/etc/nginx/certs
      - ./hexo:/usr/share/nginx/html/blog     # 博客目录
      - ./account-dist:/usr/share/nginx/html/account # 门户目录
    networks:
      - iasbt-net

networks:
  iasbt-net:
    external: true
```

### 3.2 Nginx 网关配置策略
这是实现多域名共存的关键。

**`nginx/conf.d/account.conf` (SSO)**:
```nginx
server {
    listen 443 ssl;
    server_name account.iasbt.com;
    # ... SSL 配置 ...

    location / {
        proxy_pass http://casdoor:8000; # 转发给 Casdoor 容器
        # ... proxy headers ...
    }
}
```

**`nginx/conf.d/blog.conf` (博客)**:
```nginx
server {
    listen 443 ssl;
    server_name blog.iasbt.com;
    # ... SSL 配置 ...

    root /usr/share/nginx/html/blog; # 指向挂载的 Hexo 静态文件
    index index.html;
}
```

---

## 4. 第三阶段：业务系统集成

### 4.1 统一门户 (Account Project)
您正在开发的 `account` 项目不仅是 SSO 的前端，更应该是 **应用启动器 (Launcher)**。
*   **部署**：`npm run build` 生成静态文件 -> 放入服务器 `/data/account-dist` -> Nginx 托管。
*   **功能**：
    1.  检查登录状态 (Casdoor SDK)。
    2.  未登录 -> 跳转 `account.iasbt.com/login`。
    3.  已登录 -> 展示 Dashboard，包含大大的图标卡片：
        *   [博客] (跳转 blog.iasbt.com)
        *   [相册] (跳转 iasbt.cloud)
        *   [个人中心] (跳转 Casdoor 个人资料页)

### 4.2 博客 (Hexo)
*   **SSO 需求**：通常博客是公开的，不需要登录。
*   **如果需要私密文章**：Hexo 是静态的，做权限控制很麻烦。
    *   *建议*：博客保持公开。如果非要锁，可以在 Nginx 层配合 `nginx-auth-request` 模块调用 Casdoor 验证，但配置较复杂。建议保持简单，博客就是公开展示。

### 4.3 相册项目 (Gallery)
*   **存储方案**：**强烈建议使用缤纷云 (Bitiful)**。
    *   相册应用产生缩略图后，原图和缩略图都上传到 Bitiful S3。
    *   40G 硬盘存不下多少照片，S3 是无限的且便宜。
*   **SSO 集成**：
    *   如果使用自研相册：后端集成 Casdoor OIDC。
    *   如果使用开源相册（如 **PhotoPrism**）：它支持 OIDC，直接在设置里填入 Casdoor 的 Client ID 和 Secret 即可实现“使用 Casdoor 登录”。
    *   **推荐轻量级方案**：**MT Photos** (Docker部署，极低内存，体验极佳) 或 **Immich** (功能最强但内存占用稍高，4G内存需调优)。

---

## 5. 实施路线图 (Checklist)

1.  **本周任务**：
    - [ ] 在腾讯云发起 `iasbt.com` 域名转入。
    - [ ] 注册并配置 **缤纷云 (Bitiful)**，创建存储桶。
    - [ ] 在服务器部署基础 `docker-compose.yml` (先跑通 Casdoor + MySQL)。

2.  **下周任务 (备案期间)**：
    - [ ] 开发/完善您的 Account 门户前端，集成 `casdoor-js-sdk`。
    - [ ] 选定相册应用（推荐先试用 PhotoPrism 或 MT Photos），并配置 S3 存储。
    - [ ] 配置 Nginx 本地测试，确保通过 `hosts` 文件能访问各个子域名。

3.  **备案完成后**：
    - [ ] 申请 SSL 证书 (腾讯云免费证书或 Let's Encrypt)。
    - [ ] 开放 80/443 端口，正式上线。
    - [ ] 在 Casdoor 后台配置正式的 `Callback URL`。

## 6. 核心优势
*   **合规稳定**：所有服务都在国内，访问速度极快，无封禁风险。
*   **成本极低**：
    *   计算：复用现有服务器。
    *   存储：Bitiful 免费额度覆盖大部分个人需求。
    *   认证：Casdoor 开源免费。
*   **扩展性强**：Docker 架构，未来想加个网盘 (Alist) 或笔记 (SiYuan) 也就是加几行 yaml 配置的事。
