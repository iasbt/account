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
  logout: () => void;
  handleCallback: (code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
