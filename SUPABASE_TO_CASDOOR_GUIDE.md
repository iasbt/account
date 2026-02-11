# Supabase 到 Casdoor 迁移与接管指南

本指南将指导您如何处理原有的 Supabase 资源，并在 Casdoor 中重新配置 Auth 和邮件服务。

---

## 1. 核心策略：平滑过渡

由于 Supabase 的 Auth 逻辑是闭源/托管的（基于 GoTrue），直接无缝迁移密码哈希比较困难。对于个人或小规模项目，**推荐策略**如下：

1.  **用户账户**：**重新注册**。
    *   因为是个人/小范围使用，直接在新的 Casdoor 登录页重新注册账号是最干净、最稳定的做法。
    *   *如果必须保留数据*：需要从 Supabase 导出 `auth.users` 表，然后编写脚本调用 Casdoor API 导入，但用户仍需重置密码（因为哈希算法不同）。**不建议折腾**。
2.  **邮件服务**：**切换到 SMTP**。
    *   Supabase 内置了邮件发送功能（有额度限制）。
    *   Casdoor 需要您配置一个 SMTP 服务。推荐使用 **腾讯云 SES**（专业、送额度）或 **QQ/163 邮箱**（个人免费、配置简单）。

---

## 2. 邮件服务配置 (Email Providers)

Casdoor 发送验证码、密码重置邮件都需要配置“提供商 (Provider)”。

### 方案 A：使用 QQ 邮箱 / 163 邮箱 (最简单，推荐个人)
不需要购买任何服务，直接用你自己的邮箱发信。

1.  **获取授权码**：
    *   登录 QQ 邮箱网页版 -> 设置 -> 账号 -> 开启 POP3/SMTP -> 获取 **授权码** (不是QQ密码)。
2.  **在 Casdoor 中配置**：
    *   登录 Casdoor 管理后台 (`/admin`)。
    *   点击顶部菜单 **"Providers" (提供商)** -> **"Add" (添加)**。
    *   填写配置：
        *   **Name**: `qq-email`
        *   **Category**: `Email`
        *   **Type**: `SMTP`
        *   **Client ID**: `你的QQ号@qq.com` (例如 123456@qq.com)
        *   **Client Secret**: `你的授权码` (步骤1获取的)
        *   **Host**: `smtp.qq.com`
        *   **Port**: `465`
        *   **Disable SSL**: `(不勾选)`
    *   点击 **"Save"**。
    *   点击 **"Test Connection"** 测试是否成功。

### 方案 B：使用腾讯云 SES (最专业，推荐生产)
如果您希望邮件看起来更正式（例如来自 `no-reply@iasbt.cloud`），且因为您的域名 `iasbt.cloud` 已经在腾讯云。

1.  **开通服务**：在腾讯云控制台搜索“邮件推送 SES”并开通。
2.  **配置域名**：在 SES 控制台验证 `iasbt.cloud` 域名（添加 DNS 记录）。
3.  **获取密钥**：生成 SMTP 密码。
4.  **在 Casdoor 中配置**：
    *   **Type**: `SMTP`
    *   **Host**: `smtp.qcloudmail.com`
    *   **Port**: `465`
    *   **Client ID**: `你的发信地址` (如 admin@iasbt.cloud)
    *   **Client Secret**: `腾讯云生成的SMTP密码`

---

## 3. 应用配置 (Application Config)

配置好邮件提供商后，需要告诉 Casdoor 使用它。

1.  点击顶部菜单 **"Applications" (应用)**。
2.  编辑默认应用 (通常叫 `app-built-in`)。
3.  在 **"Providers"** 区域：
    *   找到 **"Email provider"** 下拉框。
    *   选择刚刚创建的 `qq-email` 或 `tencent-ses`。
4.  在 **"Signup items"** (注册项) 中：
    *   确保勾选了 `Email`，这样用户注册时会要求填邮箱。
5.  点击 **"Save"**。

---

## 4. Supabase 资源处理

一旦 Casdoor 跑通了：

1.  **数据备份**：
    *   登录 Supabase Dashboard -> Database -> Backups。
    *   下载最新的 `.sql` 备份文件到本地保存（以防万一以后要查旧数据）。
2.  **服务暂停/删除**：
    *   如果是免费版 Supabase，可以先放着不动（它会自动暂停不活跃的项目）。
    *   如果想彻底断舍离，可以在 Settings -> General -> Delete Project。
    *   **注意**：删除前确保 `Account` 项目的前端代码已经完全修改为对接 Casdoor，不再调用 Supabase 的 API。

---

## 5. 总结：迁移清单

- [ ] **Casdoor 后台**：添加 Email Provider (SMTP)。
- [ ] **Casdoor 后台**：在 Application 中启用该 Email Provider。
- [ ] **Account 前端**：修改登录逻辑，跳转到 Casdoor 登录页 (见之前的迁移指引)。
- [ ] **Supabase**：导出数据备份，然后在此次“候鸟迁移”完成后停用。

通过这几步，您就实现了认证服务的完全自主可控，不再依赖 Supabase 的黑盒服务，且邮件通知也掌握在自己手里。
