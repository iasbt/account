# Supabase 数据库迁移指南

本指南将帮助您将 Supabase 上的所有数据备份并迁移到自建服务器的 PostgreSQL 数据库中。

## 1. 架构变更

我们使用容器化 PostgreSQL（`iasbt-postgres`）承载 Supabase 数据。

- **原架构**: 应用 -> Supabase (Cloud Postgres)
- **新架构**: 应用 -> 自建服务器 Postgres (Docker 容器)

## 2. 准备工作

### 2.1 获取 Supabase 连接信息 (关键：IPv4 兼容)
由于我们的服务器可能不支持 IPv6，**强烈建议使用 Connection Pooler (端口 6543)**。

**获取步骤：**
1. 在 Supabase 后台顶部导航栏，点击 **Connect** 按钮。
2. 选择 **URI** 标签页。
3. **关键：** 勾选底部的 **"Use connection pooler"** 复选框。
4. **关键：** Mode 选择 **"Session"** (这样支持 Prepared Statements，适合 pg_dump)。
5. 复制连接串，它应该以 `pooler.supabase.com` 结尾，端口是 `6543`。
   示例：`postgresql://postgres.izraerumphwwrjfdjfcp:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
6. 将其中的 `[YOUR-PASSWORD]` 替换为您的真实数据库密码。

### 2.2 确保本地环境
您需要安装 `PostgreSQL` 客户端工具 (包含 `pg_dump`) 或者安装了 Docker (我们可以用 Docker 运行 pg_dump)。

## 3. 迁移步骤 (自动化脚本)

我们提供了一个 PowerShell 脚本来自动化备份过程。

### 第一步：本地备份
在项目根目录下运行：
```powershell
.\deploy\backup_supabase.ps1 -DbUrl "您的Supabase连接串"
```
这将生成一个 `supabase_full_backup.sql` 文件。

### 第二步：部署最新服务
确保服务端已拉取最新代码并重建容器：
```powershell
.\deploy_remote.ps1 "v1.8.6: Deploy"
```

### 第三步：恢复数据到服务器
登录到服务器，执行以下命令：

```bash
# 1. 进入部署目录
cd /home/ubuntu/account/deploy/correction

# 2. 确保数据库已启动
docker compose up -d iasbt-postgres

# 3. 将备份文件上传到服务器后执行恢复
cat supabase_full_backup.sql | docker exec -i iasbt-postgres psql -U postgres -d supabase_backup
```

## 4. 验证
恢复完成后，您可以进入容器验证数据：
```bash
docker exec -it iasbt-postgres psql -U postgres -d supabase_backup
# 在 psql 中执行 \dt 查看表
```
