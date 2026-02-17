# Casdoor 集成 GitHub 第三方登录完整配置指南

本文档将提供从零开始在 Casdoor 中配置 GitHub OAuth 第三方登录的详细步骤。本指南适用于希望通过 GitHub 账号快速登录 Casdoor 及其下游应用（如本系统）的管理员和开发者。

---

## 目录

1. [前置准备](#1-前置准备)
2. [第一步：在 GitHub 创建 OAuth 应用](#2-第一步在-github-create-oauth-应用)
3. [第二步：在 Casdoor 添加提供商 (Provider)](#3-第二步在-casdoor-添加提供商-provider)
4. [第三步：在 Casdoor 应用中启用提供商](#4-第三步在-casdoor-应用中启用提供商)
5. [第四步：验证登录流程](#5-第四步验证登录流程)
6. [常见问题与故障排除](#6-常见问题与故障排除)

---

## 1. 前置准备

在开始之前，请确保您具备以下条件：

*   **Casdoor 管理员权限**：您需要能够登录 Casdoor 管理后台（通常是 `http://<您的IP>:8000`）。
*   **GitHub 账号**：用于创建 OAuth 应用。
*   **公网可访问的 Casdoor 地址**（推荐）：虽然本地测试 (`localhost`) 也可以，但生产环境需要真实的域名或公网 IP。
    *   *假设您的 Casdoor 访问地址为：`http://119.91.71.30:8000` (请替换为您的实际域名或 IP)*

---

## 2. 第一步：在 GitHub 创建 OAuth 应用

GitHub OAuth 应用是连接 GitHub 身份认证系统与 Casdoor 的桥梁。

1.  **登录 GitHub**
    访问 [GitHub](https://github.com/) 并登录您的账号。

2.  **进入开发者设置**
    *   点击右上角头像 -> **Settings** (设置)。
    *   在左侧菜单最下方，点击 **Developer settings** (开发者设置)。
    *   在左侧菜单点击 **OAuth Apps**。

3.  **新建 OAuth App**
    *   点击右上角的 **New OAuth App** 按钮。

4.  **填写应用信息** (关键步骤)
    请严格按照以下说明填写：

    *   **Application name** (应用名称):
        *   填入您的应用名称，例如 `Casdoor Auth` 或 `My Project Login`。用户授权时会看到此名称。
    
    *   **Homepage URL** (主页链接):
        *   填入 Casdoor 的根地址。
        *   示例：`http://119.91.71.30:8000` (或者您的域名 `https://auth.example.com`)
    
    *   **Application description** (描述):
        *   (选填) 简单描述，例如 "Login with GitHub for My System"。
    
    *   **Authorization callback URL** (回调地址) **[最重要的一步]**:
        *   这是 GitHub 认证成功后回调 Casdoor 的地址。
        *   格式固定为：`<Casdoor地址>/callback`
        *   示例：``
        *   *注意：如果这里填错，登录后会报错 `redirect_uri_mismatch`。*

5.  **注册应用**
    *   点击 **Register application** 按钮。

6.  **获取 Client ID 和 Client Secret**
    *   创建成功后，您会看到应用的详情页。
    *   **Client ID**: 直接复制页面上显示的字符串（例如 `Ov23li...`）。
    *   **Client Secrets**: 点击 **Generate a new client secret** 按钮。
        *   *注意：Secret 只会显示一次，请立即复制保存！* 如果丢失需要重新生成。

---

## 3. 第二步：在 Casdoor 添加提供商 (Provider)

回到 Casdoor 管理后台，我们需要配置刚才获取的 GitHub 凭证。

1.  **进入提供商管理**
    *   点击顶部菜单的 **Providers** (提供商)。
    *   点击 **Add** (添加) 按钮。

2.  **配置 **
    填写表单如下：

    *   **Name** (名称):
        *   自定义，建议填 ``。
    
    *   **Display name** (显示名称):
        *   填 ``。这是登录按钮上显示的文字。
    
    *   **Category** (分类):
        *   选择 **OAuth**。
    
    *   **Type** (类型):
        *   选择 **GitHub**。
    
    *   **Client ID**:
        *   粘贴刚才从 GitHub 获取的 Client ID。
    
    *   **Client Secret**:
        *   粘贴刚才从 GitHub 获取的 Client Secret。
    
    *   **Organization** (组织):
        *   选择 `iasbt` (或您的默认组织)。
    
    *   **其他字段**:
        *   Domain, Custom Auth URL 等通常留空即可，Casdoor 会使用 GitHub 默认的端点。

3.  **保存配置**
    *   点击底部的 **Save** 按钮。
    *   保存后，您可以在列表中看到新添加的 `GitHub` 提供商。

---

## 4. 第三步：在 Casdoor 应用中启用提供商

仅仅添加 Provider 还不够，您需要明确告诉 Casdoor 哪个“应用”允许使用这个 Provider。

1.  **进入应用管理**
    *   点击顶部菜单的 **Applications** (应用)。
    *   找到您的主应用（例如 `app-iasbt`），点击 **Edit** (编辑)。

2.  **关联 Provider**
    *   找到 **Providers** 配置项。
    *   在下拉列表中选择刚才创建的 `GitHub` 提供商。
    *   点击右侧的 **Add** 按钮将其加入列表。
    *   (可选) 您可以拖动列表项调整顺序，这决定了登录页上按钮的排序。

3.  **检查注册设置**
    *   确保 **Signup items** (注册项) 中包含必要的字段。
    *   GitHub 登录通常会直接创建新用户。如果您的应用禁止注册 (`Enable sign up` 为关闭状态)，新用户通过 GitHub 登录可能会失败，除非您开启了 "允许第三方登录自动注册" (通常默认开启)。

4.  **保存应用**
    *   点击底部的 **Save** 按钮。

---

## 5. 第四步：验证登录流程

1.  **打开登录页**
    *   注销当前 Casdoor 账号，或者打开一个隐身窗口。
    *   访问您的应用登录页（或者 Casdoor 的登录预览页）。

2.  **查看 GitHub 按钮**
    *   您应该在用户名/密码输入框下方看到灰色的 GitHub 图标按钮。

3.  **点击登录**
    *   点击 GitHub 按钮。
    *   页面应跳转到 `github.com` 的授权页面，显示您在第一步设置的应用名称。
    *   点击 **Authorize <您的应用名>**。

4.  **回调验证**
    *   GitHub 验证通过后，会自动跳转回 Casdoor。
    *   如果是第一次登录：
        *   Casdoor 会提示您完善信息（如果配置了），或者直接创建账号并登录。
        *   您可以在 Casdoor 的 **Users** 列表中看到一个新用户，其头像和名称通常来自 GitHub。
    *   登录成功后，Casdoor 会发放 Token 并跳转回您的业务系统。

---

## 6. 常见问题与故障排除

### Q1: 登录时 GitHub 提示 "redirect_uri_mismatch"
*   **原因**: GitHub 后台配置的 `Authorization callback URL` 与 Casdoor 实际发起的请求不一致。
*   **解决**:
    1. 检查 GitHub OAuth App 设置中的 callback URL 是否严格为 `http://<您的Casdoor域名:端口>/callback`。
    2. 确保没有多余的斜杠或拼写错误。

### Q2: 登录后 Casdoor 提示 "Client secret is invalid"
*   **原因**: Casdoor 中填写的 Client Secret 错误，或者复制时带了空格。
*   **解决**:
    1. 回到 GitHub 重置 Client Secret。
    2. 重新复制并在 Casdoor Provider 设置中更新。

### Q3: 无法获取用户邮箱 (Email 为空)
*   **原因**: GitHub 用户的邮箱可能设置为隐私 (Keep my email address private)。
*   **解决**:
    1. 这是一个常见现象。Casdoor 会尝试获取公开邮箱。
    2. 如果必须获取邮箱，可能需要在 GitHub OAuth Scope 中增加权限（Casdoor 默认已包含 `user:email`）。

### Q4: 提示 "Network Error" 或连接超时
*   **原因**: 您的 Casdoor 服务器无法连接 GitHub API (api.github.com)。国内服务器常见问题。
*   **解决**:
    1. 检查服务器网络是否能 ping 通 `github.com`。
    2. 如果服务器在国内，可能需要配置 HTTP 代理给 Casdoor 后端使用，或者将 Casdoor 部署在海外服务器。

### Q5: 第三方登录后无法绑定已有账号
*   **机制**: Casdoor 默认视第三方登录为新用户。
*   **解决**: 用户可以在“个人中心” -> “账号绑定”中，先登录已有账号，再点击绑定 GitHub，这样同一个账号就可以用密码或 GitHub 登录。

---

通过以上步骤，您应该已经成功集成了 GitHub 登录。如需集成 Google、WeChat 或 QQ，流程大同小异，核心在于获取对应平台的 Client ID 和 Secret 并填入 Casdoor。
