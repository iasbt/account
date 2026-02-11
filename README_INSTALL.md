# 🚀 服务器部署实战手册 (Step-by-Step)

本手册将手把手教您如何将配置好的 `deploy` 包上传到服务器并启动服务。

## 1. 准备工作

在您的本地电脑（就是现在您操作这台），请确认 `deploy` 文件夹已经包含了以下内容（我已经帮您生成好了）：
- `docker-compose.yml`
- `backup.sh`
- `.env`
- `data/` 目录及其下的配置文件

## 2. 上传文件到服务器

我们需要把整个 `deploy` 文件夹上传到服务器的 `/home/ubuntu/stack` 目录。
推荐使用 FileZilla, WinSCP 或直接使用命令行。

### 命令行方式 (PowerShell 或 CMD):
假设您的服务器 IP 是 `1.2.3.4`，用户名是 `ubuntu`。

```powershell
# 在 account 项目根目录下执行
scp -r deploy ubuntu@1.2.3.4:/home/ubuntu/stack
```
*(如果提示找不到 scp，请使用 FileZilla 等图形化工具上传)*

## 3. 登录服务器并启动

打开终端 SSH 登录服务器：
```bash
ssh ubuntu@1.2.3.4
```

登录成功后，执行以下命令：

```bash
# 1. 进入目录
cd /home/ubuntu/stack

# 2. 修改密码 (第一次部署必须做！)
nano .env
# -> 把 DB_ROOT_PASSWORD 改成您自己想要的复杂密码
# -> 按 Ctrl+O 保存，Ctrl+X 退出

# 3. 启动服务
sudo docker compose up -d

# 4. 查看状态
sudo docker compose ps
```

如果看到 `casdoor`, `mysql`, `nginx`, `mt-photos` 的状态都是 `Up` (Running)，恭喜您，部署成功！

## 4. 域名解析 (EdgeOne 配置)

登录腾讯云 EdgeOne 控制台：
1.  找到 `iasbt.cloud` 域名。
2.  添加 DNS 记录：
    *   `*.iasbt.cloud` -> CNAME 指向 EdgeOne 提供的加速域名。
    *   或者分别添加 `account`, `gallery`, `www` 指向您的服务器 IP。
    *   **重要**：在 EdgeOne 的“回源配置”中，设置 **回源协议** 为 **HTTP** (因为我们的 Nginx 暂时只监听了 80 端口，SSL 由 EdgeOne 负责)。

## 5. 验证访问

打开浏览器访问：
*   `https://account.iasbt.cloud` -> 应该能看到 Casdoor 登录页 (默认账号 admin / 123)
*   `https://gallery.iasbt.cloud` -> 应该能看到 MT Photos 安装向导
*   `https://www.iasbt.cloud` -> 应该能看到简单的导航页

## 6. 后续维护

*   **查看日志**：`docker compose logs -f casdoor`
*   **重启服务**：`docker compose restart`
*   **备份数据**：`bash backup.sh`
