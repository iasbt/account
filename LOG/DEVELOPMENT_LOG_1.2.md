**“保姆级·傻瓜式·全息技术档案”**。

这份文档将详细到：**连一个不懂代码的人（或者一个刚初始化的 AI），只要照着这个文档做，都能还原出整个项目。**

它包含了：

1. **每个核心文件的完整代码**（不仅仅是片段）。
    
2. **所有配置文件的具体内容**。
    
3. **数据库的每一行 SQL 指令**。
    
4. **遇到问题时的具体操作步骤**。
    
---

# Account System - 终极全息开发档案 (The Holocron)

> **版本**: v1.2 (Fool-Proof Edition)
> **最后更新**: 2026-02-05
> **密级**: 绝密 (Top Secret)
> **阅读指南**: 本文档包含项目的所有生命体征。请逐字阅读。

---

## 1. 项目身份证 (Project ID)

- **项目名称**: Account System (IAM / SSO Platform)
- **线上地址**: `https://account.iasbt.com`
- **本地端口**: `http://localhost:5173`
- **核心功能**:
    1.  **身份中心**: 注册、登录、退出。
    2.  **权限分发**: 区分普通用户 (`user`) 和管理员 (`admin`)。
    3.  **单点登录 (SSO)**: 外部应用带参数跳转过来，登录后自动跳回。
    4.  **应用门户**: 展示 Life OS 下的所有子应用 (Gallery, Note, etc.)。

---

## 2. 环境搭建 (Environment Setup)

### 2.1 依赖清单 (`package.json`)
*AI 接手时请检查以下核心依赖是否存在：*
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@supabase/supabase-js": "^2.47.10",
    "zustand": "^5.0.2",
    "lucide-react": "^0.469.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "vite": "^6.0.5",
    "typescript": "~5.6.2",
    "tailwindcss": "^3.4.17"
  }
}
````

### 2.2 环境变量 (`.env`)

_必须在项目根目录新建 `.env` 文件，内容如下（值去 Supabase 后台找）：_

代码段

```
# 你的 Supabase 项目 URL
VITE_SUPABASE_URL=[https://xxxxxxxxxxxx.supabase.co](https://xxxxxxxxxxxx.supabase.co)

# 你的 Supabase `anon` public key (公开的那个，不是 service_role)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Vercel 路由配置 (`vercel.json`)

_必须在根目录创建此文件，否则刷新页面报 404。_

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

---

## 3. 数据库全量脚本 (Database & SQL)

**操作方法**: 登录 Supabase -> SQL Editor -> New Query -> 粘贴以下全部 -> Run。

### 3.1 建表脚本

SQL

```
-- 1. 用户档案表 (业务核心)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  role text default 'user', -- ⚠️ 重要: 这是判断管理员的依据
  avatar_url text,
  primary key (id)
);

-- 2. 访问日志表 (审计核心)
create table public.user_app_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  app_id text not null,
  app_name text not null,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now())
);
```

### 3.2 自动化触发器 (必装)

_没有这个，新注册用户无法登录，因为 profiles 表会是空的。_

SQL

```
-- 创建函数
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- 绑定触发器
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3.3 安全策略 (RLS)

_不跑这个，前端读不到数据。_

SQL

```
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

alter table public.user_app_access enable row level security;
create policy "Users can insert own logs" on user_app_access for insert with check (auth.uid() = user_id);
create policy "Users can view own logs" on user_app_access for select using (auth.uid() = user_id);
```

---

## 4. 核心代码逻辑 (The Source Code)

### 4.1 自动排毒入口 (`src/main.tsx`)

_功能：每次发版自动清理用户缓存，防止白屏。_

TypeScript

```
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- 🛡️ 自动排毒逻辑 START ---
const APP_VERSION = 'v1.2.0'; // 每次发版修改这里
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
  console.log(`♻️ [Cache Buster] Updating from ${storedVersion} to ${APP_VERSION}`);
  localStorage.clear(); // 清空 LocalStorage
  sessionStorage.clear(); // 清空 SessionStorage
  localStorage.setItem('app_version', APP_VERSION); // 写入新版本
  window.location.reload(); // 强制刷新
}
// --- 🛡️ 自动排毒逻辑 END ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 4.2 认证仓库 (`src/store/useAuthStore.ts`)

_功能：并行登录初始化 + 核弹级退出。_

TypeScript

```
// (imports 省略...)

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  // --- 🚀 初始化：并行加速 + 熔断 ---
  initialize: async () => {
    set({ loading: true });
    try {
      // 1. 定义2秒超时炸弹
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 2000)
      );
      
      // 2. 数据库查询
      const profileQuery = supabase.from('profiles').select('*').single();

      // 3. 并行请求 (同时查 Session 和 Profile)
      const [sessionResult, profileResult] = await Promise.all([
        supabase.auth.getSession(),
        Promise.race([profileQuery, timeoutPromise]).catch(err => ({ data: null, error: err }))
      ]);

      const session = sessionResult.data.session;
      if (!session) {
        set({ user: null, session: null });
        return; 
      }

      // 4. 处理权限 (如果超时，默认给 user 权限，保证能进系统)
      // @ts-ignore
      const role = profileResult.data?.role || 'user';
      
      set({ 
        session, 
        user: { ...session.user, role: role } 
      });

    } catch (error) {
      console.error('Auth Init Error:', error);
    } finally {
      set({ loading: false }); // ⚠️ 无论死活，必须关闭 Loading
    }
  },

  // --- 💣 退出：核弹级清理 ---
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      set({ user: null, session: null });
      localStorage.clear(); // 清除所有脏数据
      window.location.href = '/login'; // ⚠️ 强制硬刷新，防止手机端死循环
    }
  }
}));
```

### 4.3 SSO 登录页 (`src/features/auth/components/LoginForm.tsx`)

_功能：登录成功后，根据 URL 参数决定去哪。_

TypeScript

```
// ... inside handleLogin success block ...

// 1. 获取 URL 中的 redirect 参数
const params = new URLSearchParams(window.location.search);
const redirectUrl = params.get('redirect');

if (redirectUrl) {
  // 2. 如果有 redirect，直接跳走 (SSO 模式)
  window.location.href = redirectUrl;
} else {
  // 3. 如果没有，进入个人中心
  navigate('/', { replace: true });
}
```

---

## 5. 常见问题急救手册 (Troubleshooting)

### Q1: 我怎么当管理员？(How to become Admin)

**现象**: 访问 `/admin` 被踢回首页。 **操作**:

1. 登录 Supabase 后台。
    
2. 进入 **Table Editor** -> **profiles** 表。
    
3. 找到你的邮箱。
    
4. 双击 `role` 列，把 `user` 改成 `admin`。
    
5. 点击底部的 **Save**。
    
6. 刷新网页。
    

### Q2: 手机上一直重复登录/死循环 (Infinite Loop)

**原因**: 手机缓存了旧代码。 **操作**:

1. **用户操作**: 清除浏览器缓存，或者等待 `main.tsx` 中的版本号更新自动生效。
    
2. **开发者操作**: 修改 `src/main.tsx` 中的 `APP_VERSION`，推送到线上。
    

### Q3: 登录转圈出不来 (Infinite Spinner)

**原因**: 数据库睡着了 (Cold Start)。 **机制**: `useAuthStore` 里的 2秒熔断机制会自动生效。如果还没生效，请检查控制台是否报错，确认 `try/finally` 块是否存在。

### Q4: 页面 404

**原因**: 缺少 `vercel.json`。 **操作**: 检查根目录是否有该文件，内容是否为 `rewrites` 配置。

---

## 6. 开发规范 (Rules)

1. **禁止删除 AdminGuard**: `src/components/auth/AdminGuard.tsx` 是后台唯一的防线，绝对不能动。
    
2. **禁止暴露 Admin 按钮**: UI 上不要加“管理后台”的链接，保持隐蔽。
    
3. **每次发版必改版本号**: 只要动了 `useAuthStore`，必须去 `main.tsx` 升级 `APP_VERSION`。
    
