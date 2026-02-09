

````
# Account System - 终极开发全书 (The Project Bible)

> 状态: 已归档
> 归档时间: 2026-02-09
> 归档责任人: Account Maintainer
>
> **版本**: v2.0.0 (Ultimate Edition)
> **最后更新**: 2026-02-05
> **文档密级**: 最高 (Top Secret)
> **用途**: 本文档是 Account 项目的**唯一真理来源**。任何接手此项目的 AI 助手或开发者，在编写任何代码前，必须首先阅读本文档。它记录了从架构设计、数据库重建到每一个 Bug 修复的所有细节。

---

## 1. 项目基础 (Project Foundation)

### 1.1 项目定义
- **名称**: Account System (IAM / SSO Platform)
- **URL**: `https://account.iasbt.com`
- **定位**: "Life OS" 生态系统的**中央心脏**。负责所有子应用（如 Gallery, Obsidian 等）的身份认证、Token 分发、权限控制 (RBAC) 和单点登录 (SSO)。
- **核心原则**: 安全优先、移动端优先、无感跳转。

### 1.2 技术栈详解 (Detailed Tech Stack)
| 类别 | 技术/库 | 版本/备注 |
| :--- | :--- | :--- |
| **Frontend** | React | v18.x (使用 Function Components + Hooks) |
| **Build Tool** | Vite | v5.x (极速构建，配置了 alias) |
| **Language** | TypeScript | 强类型约束，禁止隐式 any |
| **Styling** | TailwindCSS | Utility-first CSS 框架 |
| **State** | Zustand | `useAuthStore` 全局状态管理 |
| **Routing** | React Router DOM | v6 (SPA 路由) |
| **Backend** | Supabase | 托管的 PostgreSQL + GoTrue Auth |
| **Icons** | Lucide React | 轻量级图标库 |
| **Hosting** | Vercel | 配置为 SPA Rewrite 模式 |

### 1.3 关键文件目录 (Directory Map)
```text
/
├── public/              # 静态资源 (favicon, robots.txt)
├── src/
│   ├── components/      # UI 组件
│   │   ├── layout/      # 布局组件 (Navbar, Footer)
│   │   ├── ui/          # 基础组件 (Button, Input)
│   │   └── auth/        # 认证相关 (LoginForm, AdminGuard)
│   ├── features/        # 业务功能模块
│   ├── lib/             # 第三方库配置 (supabase.ts)
│   ├── pages/           # 页面级组件 (LoginPage, Dashboard, Admin)
│   ├── store/           # Zustand 状态管理 (useAuthStore.ts <--- 核心!)
│   ├── App.tsx          # 路由配置入口
│   └── main.tsx         # 应用入口 (含 Auto-Detox 逻辑)
├── .env                 # 环境变量 (Supabase URL/Key)
├── vercel.json          # Vercel 路由配置文件
├── index.html           # HTML 入口
└── package.json         # 依赖清单
````

---

## 2. 核心架构逻辑 (Critical Architectures - DO NOT MODIFY)

### 2.1 认证初始化：并行加速与熔断 (The "Parallel Turbo" Engine)

_文件_: `src/store/useAuthStore.ts`

- **背景**: Supabase 免费实例有“冷启动”问题，导致串行查询（先查 Session 再查 Profile）首次加载耗时超过 10 秒。
    
- **逻辑**:
    
    1. **并行 (Promise.all)**: 同时发起 `getSession` 和 `getProfile`。
        
    2. **熔断 (Circuit Breaker)**: Profile 查询被包裹在 2 秒超时 Promise 中。
        
    3. **兜底**: 如果 2 秒内数据库未响应，强制判定 `role = 'user'`，先让用户进系统，不阻断 UI。
        
- **关键代码**:
    
    TypeScript
    
    ```
    // 超时控制
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile query timeout')), 2000)
    );
    // 竞速机制
    const [sessionResult, profileResult] = await Promise.all([
      supabase.auth.getSession(),
      Promise.race([profileQuery, timeoutPromise]).catch(err => ({ data: null, error: err }))
    ]);
    ```
    

### 2.2 退出登录：核弹级清理 (Nuclear SignOut)

_文件_: `src/store/useAuthStore.ts`

- **背景**: iOS Safari 和微信浏览器极其顽固地缓存 LocalStorage 和内存状态。普通 `Maps('/login')` 会导致旧 Token 残留，用户再次登录时陷入死循环。
    
- **解决方案**:
    
    1. Supabase 服务端退出。
        
    2. 清空 Zustand Store。
        
    3. 清空 LocalStorage & SessionStorage。
        
    4. **关键**: 使用 `window.location.href = '/login'` 强制浏览器重载页面 (Hard Reload)。
        

### 2.3 自动排毒系统 (Auto-Detox System)

_文件_: `src/main.tsx`

- **背景**: 每次发版更新 Auth 逻辑时，老用户的本地缓存与新代码不兼容，导致白屏。
    
- **逻辑**: 在 React `createRoot` 之前运行。检查 `localStorage.getItem('app_version')`。如果版本号与代码中的 `APP_VERSION` 不一致：
    
    1. 控制台输出 "♻️ [Cache Buster]..."
        
    2. 执行 `localStorage.clear()`
        
    3. `window.location.reload()` 这保证了所有用户在版本更新后强制获得一个干净的环境。
        

### 2.4 SSO 跳转流程 (Redirect Flow)

_文件_: `src/features/auth/components/LoginForm.tsx`

- **背景**: 外部应用（如 Gallery）跳转来登录时，URL 会携带 `?redirect=https://...`。
    
- **逻辑**:
    
    1. 登录成功。
        
    2. 解析 URL Query Params。
        
    3. 如果有 `redirect`: `window.location.href = redirectUrl` (跳出)。
        
    4. 如果没有: `Maps('/')` (进入 Account 首页)。
        

---

## 3. 数据库全景 (Database Schema & SQL)

**注意**: 必须在 Supabase SQL Editor 中运行以下脚本，否则系统无法正常工作。

### 3.1 核心表：Profiles

SQL

```
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  role text default 'user', -- 核心权限字段：'user' 或 'admin'
  avatar_url text,
  primary key (id)
);
```

### 3.2 自动化触发器 (Trigger)

_作用：解决“注册了账号但 profiles 表是空的”问题。_

SQL

```
-- 1. 定义函数
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- 2. 绑定触发器
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3.3 审计表：User App Access

_作用：记录用户点击了哪些应用。_

SQL

```
create table public.user_app_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  app_id text not null,
  app_name text not null,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now())
);
-- RLS 策略：允许用户读写自己的记录
alter table public.user_app_access enable row level security;
create policy "Users can insert own access logs" on user_app_access for insert with check (auth.uid() = user_id);
create policy "Users can view own access logs" on user_app_access for select using (auth.uid() = user_id);
```

---

## 4. 部署与环境配置 (Deployment & Config)

### 4.1 环境变量 (.env)

Bash

```
VITE_SUPABASE_URL=https://<your-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4.2 Vercel 路由重写 (vercel.json)

**至关重要**: 解决 React SPA 在 Vercel 上刷新报 404 的问题。

JSON

```
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.3 管理员权限设置 (Admin Setup)

_前端没有注册管理员的界面。必须直接操作数据库。_

1. 进入 Supabase Dashboard -> Table Editor -> `profiles` 表。
    
2. 找到你的用户行。
    
3. 将 `role` 列的值从 `user` 修改为 `admin`。
    
4. 点击 Save。
    
5. 在 Account 应用中刷新页面，访问 `/admin`。
    

---

## 5. 故障排查实录 (The "Graveyard" of Bugs)

### Bug #001: 无限 Loading 转圈 (Logic Deadlock)

- **现象**: 访问任何页面，中间的 Spinner 一直转，控制台无报错。
    
- **原因**: `initialize` 函数在某些异常路径（如 Session 存在但 Fetch 失败）中漏写了 `set({ loading: false })`。
    
- **修复**: 全局使用 `try...finally` 结构，确保 loading 必关闭。
    

### Bug #002: 手机端登录死循环 (Zombie State)

- **现象**: 点击退出后，跳转回登录页，但输入密码登录后，瞬间又跳回登录页，无限循环。
    
- **原因**: 移动端浏览器复用了内存中旧的 Auth Store 状态。
    
- **修复**: 退出时使用 `window.location.href` 替代 React Router 跳转；启动时增加 `Auto-Detox` 版本检测。
    

### Bug #003: 404 Not Found on Logout

- **现象**: 点击退出，浏览器 URL 变为 `/login`，但页面显示 Vercel 的 404 错误页。
    
- **原因**: Vercel 服务器试图寻找名为 `login` 的文件，但项目是 SPA。
    
- **修复**: 添加 `vercel.json` 将所有请求重定向到 `index.html`。
    

### Bug #004: 数据库 Profiles 为空

- **现象**: 新用户注册后，无法登录，或者后台报错 "Violates foreign key constraint"。
    
- **原因**: 缺少 Postgres Trigger，`auth.users` 和 `public.profiles` 数据未同步。
    
- **修复**: 运行 3.2 章节的 SQL 脚本。
    

### Bug #005: 登录极慢 (>10s)

- **现象**: 点击登录按钮后，转圈超过 10 秒才进入。
    
- **原因**: 串行等待数据库响应，且数据库处于冷启动休眠状态。
    
- **修复**: 实施 2.1 章节的并行查询 + 2秒超时熔断。
    

### Bug #006: Gallery 应用报错 "Invalid schema: gallery"

- **现象**: 子应用连接数据库失败。
    
- **原因**: Supabase Client 配置错误地指定了 `db: { schema: 'gallery' }`。
    
- **修复**: 移除 schema 配置，强制使用 `public`。
    

---

## 6. 未来维护指南 (Maintenance Guide)

1. **发布新版本**: 如果修改了 Auth 逻辑或缓存结构，请务必修改 `src/main.tsx` 中的 `APP_VERSION` (例如从 `'v1.1.0'` 改为 `'v1.2.0'`)。这将触发所有用户的自动缓存清理。
    
2. **添加新应用**: 如果 Life OS 增加了新应用（如 Note），请在 `DashboardPage.tsx` 的 Grid 中添加新的 Card，并确保其 URL 带上 `?redirect` 参数。
    
3. **子应用接入**: 所有子应用 (Gallery, etc.) 的 Supabase Client 配置必须使用默认 Schema (`public`)，**严禁**配置 `db: { schema: '...' }`。
