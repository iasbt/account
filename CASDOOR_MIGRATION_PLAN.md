# Casdoor 部署与迁移方案 (备案友好版)

## 1. 核心选择：Casdoor
鉴于你的需求（轻量、全功能、个人使用、国内备案、数据本地化），**Casdoor** 是目前的最佳选择。

### 为什么选择 Casdoor？
1.  **极度轻量**：基于 Go 语言开发，内存占用极低（仅需 ~100MB），相比 Java 开发的 Keycloak（需 1GB+）更适合单机部署。
2.  **国产合规**：由国内开源社区（Casbin）维护，对中文支持极好，符合国内数据安全与备案要求（数据完全存储在你广州的服务器上，不跨境）。
3.  **功能全**：自带 登录/注册/忘记密码 UI、OAuth 2.0/OIDC/SAML 支持、多应用管理、第三方登录（微信/QQ/钉钉等国内源）。
4.  **架构简单**：Casdoor (Web+API) + MySQL (数据库) 即可运行，维护成本极低。

---

## 2. 部署架构 (腾讯云广州服务器)

我们将完全替换掉 Supabase，所有数据存储在本地。

```mermaid
graph TD
    User[用户] -->|HTTPS (443)| Nginx[Nginx 反向代理]
    Nginx -->|端口 8000| Casdoor[Casdoor 认证服务]
    Casdoor -->|数据存储| MySQL[MySQL 数据库]
    
    subgraph 腾讯云服务器
    Nginx
    Casdoor
    MySQL
    end
```

---

## 3. 部署步骤

### 步骤 A: 准备环境
确保服务器已安装 Docker 和 Docker Compose。

### 步骤 B: 配置文件 (docker-compose.yml)
将在项目根目录创建 `casdoor-deploy` 目录用于存放部署配置。

### 步骤 C: 数据迁移与初始化
1.  启动服务后，Casdoor 会自动初始化数据库。
2.  默认账号：`admin` / `123`。
3.  你需要登录后台创建一个新的 Organization（组织）和 Application（应用）。

---

## 4. 现有 Account 项目的定位调整
你现有的 `Account` 前端项目（React）无需完全废弃，但其角色将发生转变：
-   **旧角色**：集成了 Auth 逻辑的完整认证中心（直接调 Supabase）。
-   **新角色**：一个单纯的 **Dashboard（应用门户）**。
    -   **登录**：点击登录 -> 跳转 Casdoor 统一登录页 -> 跳回 Dashboard。
    -   **管理**：用户管理、应用管理等功能直接使用 Casdoor 自带的 Admin UI（非常完善），Account 项目可以只保留“展示子应用入口”的功能，或者直接使用 Casdoor 自带的门户功能（Casdoor 也有一个简单的应用列表页）。

**推荐策略**：
初期直接使用 **Casdoor 自带的 UI** 处理所有登录、注册和应用列表需求。现有的 Account 项目代码可以封存备用，或者改造成一个极简的 OIDC Client 仅用于展示。

## 5. 备案优势
-   **服务器**：腾讯云广州（境内）。
-   **域名**：解析到该 IP。
-   **数据**：MySQL 运行在本地盘，**无任何跨境数据传输**。
-   **结论**：完全符合 ICP 备案与公安联网备案要求。
