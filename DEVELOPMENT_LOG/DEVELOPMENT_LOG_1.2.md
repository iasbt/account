

# Account System - 零点还原手册 (The Zero-Point Restoration Manual)

> **版本**: v4.0.0 (Final Complete Edition)
> **最后更新**: 2026-02-05
> **密级**: 核心机密
> **用途**: 本文档包含重建项目所需的**所有**代码逻辑、数据库脚本和配置细节。它是项目的 DNA。

---

## 1. 项目概况 (Project Blueprint)

- **项目名称**: Account System (Life OS Identity Center)
- **核心域名**: `https://account.iasbt.com`
- **本地开发**: `http://localhost:5173`
- **定位**: 整个生态系统的 Auth Provider (认证提供商)、SSO 枢纽、权限管理器。
- **架构模式**: SPA (React) + BaaS (Supabase) + Serverless Edge (Vercel).

---

## 2. 环境配置与脚手架 (Infrastructure)

### 2.1 目录结构 (File Tree)
```text
/
├── .env                 # 环境变量 (必须手动创建)
├── vercel.json          # 路由重写配置
├── vite.config.ts       # 构建配置
├── src/
│   ├── lib/
│   │   └── supabase.ts  # Supabase 客户端实例
│   ├── store/
│   │   └── useAuthStore.ts  # 核心状态管理 (Auth Logic)
│   ├── components/
│   │   └── auth/
│   │       └── AdminGuard.tsx # 路由守卫
│   ├── features/
│   │   └── auth/
│   │       └── components/
│   │           └── LoginForm.tsx # 登录组件 (含 SSO 逻辑)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── AdminPage.tsx
│   ├── App.tsx          # 路由入口
│   └── main.tsx         # 应用入口 (自动排毒)
````

### 2.2 核心配置文件 (Config Files)

**1. `.env` (环境变量)**

代码段

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-public-anon-key>
```

**2. `vercel.json` (解决 404 问题)**

JSON

```
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**3. `src/lib/supabase.ts` (Supabase 初始化)**

TypeScript

```
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 3. 数据库全量重建脚本 (Database Schema)

**操作指南**: 复制以下 SQL 到 Supabase SQL Editor 并运行。

SQL

```
-- ==========================================
-- 1. 核心业务表: Profiles
-- ==========================================
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  role text default 'user', -- 'admin' 或 'user'
  avatar_url text,
  primary key (id)
);

-- 开启 RLS
alter table public.profiles enable row level security;

-- 策略: 所有人可读，自己可改
create policy "Public profiles are viewable by everyone" 
  on profiles for select using (true);
create policy "Users can update own profile" 
  on profiles for update using (auth.uid() = id);

-- ==========================================
-- 2. 自动化触发器 (注册即创建 Profile)
-- ==========================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. 审计日志表: User App Access
-- ==========================================
create table public.user_app_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  app_id text not null,
  app_name text not null,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_app_access enable row level security;

-- 策略: 用户只能记录和查看自己的日志
create policy "insert_own" on user_app_access for insert with check (auth.uid() = user_id);
create policy "select_own" on user_app_access for select using (auth.uid() = user_id);
```

---

## 4. 核心逻辑源代码 (The Source Code)

### 4.1 入口排毒: `src/main.tsx`

**功能**: 版本不一致时，强制清空缓存并刷新，防止白屏。

TypeScript

```
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ⚠️ 发版修改此版本号
const APP_VERSION = 'v1.2.0'; 
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
  console.log(`♻️ Auto-Detox: ${storedVersion} -> ${APP_VERSION}`);
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('app_version', APP_VERSION);
  window.location.reload();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 4.2 状态心脏: `src/store/useAuthStore.ts`

**功能**: 并行初始化 + 熔断机制 + 核弹退出。

TypeScript

```
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
// types 省略...

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    set({ loading: true });
    try {
      // 1. 定义超时炸弹 (2秒)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile Timeout')), 2000)
      );

      // 2. 并行请求: Session (必选) + Profile (可选/带超时)
      const [sessionRes, profileRes] = await Promise.all([
        supabase.auth.getSession(),
        Promise.race([
          supabase.from('profiles').select('*').single(),
          timeoutPromise
        ]).catch(err => ({ data: null, error: err }))
      ]);

      const session = sessionRes.data.session;
      if (!session) {
        set({ user: null, session: null }); 
        return; 
      }

      // 3. 权限兜底: 如果超时，默认给 user
      // @ts-ignore
      const role = profileRes.data?.role || 'user';
      
      set({ session, user: { ...session.user, role } });
    } catch (e) {
      console.error(e);
      set({ user: null, session: null });
    } finally {
      set({ loading: false }); // ⚠️ 必须关闭 Loading
    }
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); } finally {
      set({ user: null, session: null });
      localStorage.clear(); 
      window.location.href = '/login'; // ⚠️ 强制硬刷新
    }
  }
}));
```

### 4.3 SSO 登录: `src/features/auth/components/LoginForm.tsx`

**功能**: 处理 `?redirect=` 跳转。

TypeScript

```
// ... inside handleLogin
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;

// 登录成功后:
const params = new URLSearchParams(window.location.search);
const redirectUrl = params.get('redirect');

if (redirectUrl) {
  window.location.href = redirectUrl; // 外部跳转
} else {
  navigate('/', { replace: true });   // 内部跳转
}
```

### 4.4 安全守卫: `src/components/auth/AdminGuard.tsx`

**功能**: 保护 `/admin` 路由。

TypeScript

```
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminGuard = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuthStore();

  if (loading) return <div>Loading...</div>;

  // 只有 role 为 admin 才能过，否则踢回首页
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};
```

### 4.5 路由配置: `src/App.tsx`

**功能**: 组装所有页面。

TypeScript

```
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { AdminGuard } from './components/auth/AdminGuard';
// import pages...

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  
  useEffect(() => { initialize(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* 普通用户区域 */}
        <Route path="/" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute> 
        }/>

        {/* 管理员隐身区域 */}
        <Route path="/admin" element={
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 5. 运维操作手册 (Operations Manual)

### 5.1 如何手动提升管理员

_前端没有注册管理员的功能，必须操作数据库。_

1. 进入 Supabase Dashboard -> Table Editor -> `profiles` 表。
    
2. 找到目标用户。
    
3. 将 `role` 列的值修改为 `admin`。
    
4. 点击 **Save**。
    

### 5.2 如何处理手机端死循环

_如果你改了代码，用户手机缓存没清，会一直跳。_

1. 修改 `src/main.tsx` 里的 `APP_VERSION` (例如 `v1.2` -> `v1.3`)。
    
2. 推送代码。
    
3. 用户下次打开时，代码会自动执行 `localStorage.clear()` 并刷新。
    

### 5.3 子应用接入规范

_Life OS 下的其他应用 (Gallery, Note) 接入 Supabase 时：_

1. **禁止**使用 `schema: 'gallery'`。
    
2. **必须**使用默认配置 `createClient(url, key)` (即 schema = public)。
    
3. 如果需要跳转回 Account 登录，URL 格式为： `https://account.iasbt.com/login?redirect=https://gallery.iasbt.com`
    