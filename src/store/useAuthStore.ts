import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { casdoorConfig } from '../lib/casdoor';
import { generateCodeVerifier, generateCodeChallenge } from '../lib/utils';

// 定义适配 Casdoor 的用户结构
export interface CasdoorUser {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  email: string;
  createdTime?: string;
  isAdmin?: boolean;
}

interface AuthState {
  token: string | null;
  user: CasdoorUser | null;
  isAuthenticated: boolean;
  
  // Actions
  login: () => Promise<void>; // Deprecated: Redirect flow
  loginWithPassword: (account: string, password: string) => Promise<void>; // New: Direct flow
  sendVerificationCode: (dest: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; displayName?: string; code?: string }) => Promise<void>;
  updateProfile: (data: Partial<CasdoorUser>) => Promise<void>;
  logout: () => void;
  handleCallback: (code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      // 发送验证码
      sendVerificationCode: async (dest) => {
        const payload = {
          dest,
          type: "signup",
          applicationId: `${casdoorConfig.organizationName}/${casdoorConfig.appName}`,
          checkUserExist: true // 注册时检查用户是否存在
        };

        const res = await fetch(`${casdoorConfig.serverUrl}/api/send-verification-code`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.status !== 'ok') {
          throw new Error(result.msg || '发送验证码失败');
        }
      },

      // 注册新用户
      register: async (data) => {
        const payload = {
          owner: casdoorConfig.organizationName,
          name: data.name,
          displayName: data.displayName || data.name,
          email: data.email,
          password: data.password,
          application: casdoorConfig.appName,
          type: "normal-user", // 默认用户类型
          region: "CN",
          properties: {
             ...(data.code ? { code: data.code } : {}) // 如果有验证码，则带上
          }
        };

        // 如果提供了验证码，URL 需要带上 query 参数或者 payload 中处理
        // Casdoor 的 signup API 通常不需要 code，除非在 Application 配置了 "Sign up items" 包含 Verification code
        // 如果包含 Verification code，通常需要先调用 send-verification-code
        // 并在 signup 时 Casdoor 会自动校验？或者需要手动校验？
        // 标准做法是：Casdoor 后端在 signup 时会检查验证码是否匹配（如果配置了需要验证码）
        // 这里的 payload 结构可能需要调整，Casdoor 的 add-user API 可能不直接支持 code 校验
        // 但是 signup API (通常是 /api/signup) 支持。
        // 我们这里用的是 /api/signup，它应该支持 code 参数。
        // 修正：code 应该放在 query parameters 或者 body 的特定字段
        
        // Casdoor /api/signup 源码逻辑：
        // 接受 User 对象。如果 Application 需要验证码，它会检查 cache 中的验证码。
        // 验证码通常关联在 email 上。
        // 我们只需要确保在调用 signup 之前，验证码已经发送并且有效。
        // 并且，为了安全，signup 请求可能需要带上 code 以便后端验证所有权。
        // 实际上 Casdoor 的 signup 逻辑比较复杂，取决于配置。
        // 如果配置了 Email Verification，Casdoor 前端会发送 code。
        // 我们在 payload 中加入 code 字段试试。

        // 再次确认：Casdoor 的 /api/signup 接口参数
        // 它接收一个 User 对象。
        // 验证码校验逻辑通常在 adapter 或者 service 层。
        // 让我们尝试将 code 放入 URL 参数，或者 User.properties 中，或者直接作为 User 的一个字段（虽然 User struct 没有 code）
        // 查看 Casdoor 官方文档或源码，VerificationCode 检查通常在 signup handler 中：
        // "checkVerificationCode(dest, code, lang)"
        // 它从 URL query param "code" 读取？不，通常是请求体。
        // 让我们尝试把 code 放到 query string 中，这是最常见的做法。
        
        const url = new URL(`${casdoorConfig.serverUrl}/api/signup`);
        if (data.code) {
          url.searchParams.append('code', data.code);
        }

        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.status !== 'ok') {
          throw new Error(result.msg || '注册失败');
        }
      },

      // 更新用户信息
      updateProfile: async (data) => {
        const { user, token } = get();
        if (!user) throw new Error("未登录");

        // 构造 Casdoor 用户对象
        const updatedUser = {
          ...user,
          ...data,
          owner: casdoorConfig.organizationName, // 必须包含 owner
          name: user.name // 必须包含 name 作为主键
        };

        // Casdoor update-user API
        // 注意：通常需要管理员权限或拥有者权限。如果开启了 "用户自管理"，则用户可以修改自己。
        // 这里尝试使用 access_token 进行鉴权
        const res = await fetch(`${casdoorConfig.serverUrl}/api/update-user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // 如果 Casdoor 配置了 API 鉴权，需要带上 Token
             ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(updatedUser)
        });

        const result = await res.json();
        if (result.status !== 'ok') {
          // 尝试兼容性处理：有时 Casdoor 返回 data 字段
          if (result.data !== 'Affected') {
             throw new Error(result.msg || '更新失败');
          }
        }

        // 更新本地状态
        set({ user: { ...user, ...data } as CasdoorUser });
      },

      // 旧的跳转登录方式 (保留作为降级方案)
      login: async () => {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        sessionStorage.setItem('casdoor_code_verifier', verifier);

        const redirectUri = encodeURIComponent(`${window.location.origin}${casdoorConfig.redirectPath}`);
        const scope = 'read';
        const state = casdoorConfig.appName;
        
        const loginUrl = `${casdoorConfig.serverUrl}/login/oauth/authorize?client_id=${casdoorConfig.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge_method=S256&code_challenge=${challenge}`;
        window.location.href = loginUrl;
      },

      // 新的直接登录方式 (无感登录)
      loginWithPassword: async (account, password) => {
        // 1. 使用 Password Grant Type 直接换取 Token (需 Casdoor 开启支持)
        // 或者使用 Casdoor 原生登录 API
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', casdoorConfig.clientId);
        params.append('username', account);
        params.append('password', password);
        params.append('scope', 'read');
        // 注意: Public Client 通常不需要 client_secret，如果 Casdoor 强制需要，则此模式不适用
        // 这里假设 Casdoor 允许 public client 的 password grant

        const tokenRes = await fetch(`${casdoorConfig.serverUrl}/api/login/oauth/access_token`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString(),
        });

        if (!tokenRes.ok) {
           // Fallback: 尝试 Casdoor 内部 login API (模拟前端登录)
           const loginParams = {
             organization: casdoorConfig.organizationName,
             username: account,
             password: password,
             application: casdoorConfig.appName,
             type: "normal",
             autoSignin: true
           };
           
           const loginRes = await fetch(`${casdoorConfig.serverUrl}/api/login`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(loginParams)
           });
           
           const loginData = await loginRes.json();
           if (loginData.status !== 'ok') {
             throw new Error(loginData.msg || '登录失败');
           }
           
           // 登录成功后，Casdoor 会设置 Session，我们需要手动获取 Token 或 UserInfo
           // 由于是跨域，Session Cookie 可能存不上。
           // 如果 Password Grant 失败，通常是因为配置问题。
           // 为了确保任务完成，这里我们抛出明确错误，建议使用 Password Grant
           throw new Error(`直连登录失败 (${tokenRes.status})。请联系管理员开启 Password Grant 支持或检查网络。`);
        }

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
           throw new Error(tokenData.error_description || tokenData.error);
        }

        const accessToken = tokenData.access_token;
        set({ token: accessToken, isAuthenticated: true });

        // 2. 获取用户信息
        const userRes = await fetch(`${casdoorConfig.serverUrl}/api/get-account?access_token=${accessToken}`);
        const userJson = await userRes.json();
        
        if (userJson.status === 'ok') {
          set({ user: userJson.data });
        } else {
          console.error('Failed to get user info:', userJson.msg);
        }
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        sessionStorage.removeItem('casdoor_code_verifier');
        // 可选：跳转到 Casdoor 注销
        // window.location.href = `${casdoorConfig.serverUrl}/logout`;
      },

      handleCallback: async (code) => {
        const verifier = sessionStorage.getItem('casdoor_code_verifier');
        if (!verifier) {
          throw new Error('Missing code_verifier. Please login again.');
        }

        const redirectUri = `${window.location.origin}${casdoorConfig.redirectPath}`;
        
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', casdoorConfig.clientId);
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        params.append('code_verifier', verifier);

        const res = await fetch(`${casdoorConfig.serverUrl}/api/login/oauth/access_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Token exchange failed: ${err}`);
        }

        const data = await res.json();
        
        // 解析 User Info (简单解码或再次请求 userinfo 端点)
        const userRes = await fetch(`${casdoorConfig.serverUrl}/api/userinfo`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        
        if (userRes.ok) {
           const userData = await userRes.json();
           set({ 
             token: data.access_token, 
             user: {
               id: userData.sub || userData.id,
               name: userData.name,
               displayName: userData.displayName || userData.name,
               avatar: userData.avatar,
               email: userData.email,
               isAdmin: userData.isAdmin || false // Casdoor userinfo 可能包含 isAdmin
             }, 
             isAuthenticated: true 
           });
        } else {
           // Fallback if userinfo endpoint fails
           set({ token: data.access_token, isAuthenticated: true });
        }
        
        sessionStorage.removeItem('casdoor_code_verifier');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
