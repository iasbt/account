import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { redirectToAuth } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { setRefreshToken } from '@/lib/auth-utils';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. Try to get code from Query Params (Standard OAuth2)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        
        // 2. Fallback to Hash (Legacy Implicit Flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessTokenHash = hashParams.get('access_token');

        if (accessTokenHash) {
             // Legacy flow support (if needed, or just remove)
             await login(accessTokenHash);
             navigate('/', { replace: true });
             return;
        }

        if (!code) {
          setError('未找到认证授权码 (Code)');
          return;
        }

        const verifier = localStorage.getItem('pkce_verifier');
        if (!verifier) {
          setError('PKCE 验证失败：找不到 verifier，请重新登录');
          return;
        }

        // 3. Exchange Code for Token
        const accountUrl = import.meta.env.VITE_ACCOUNT_URL?.replace(/\/$/, '');
        const clientId = import.meta.env.VITE_CLIENT_ID || 'gallery-client';
        const redirectUri = `${window.location.origin}/auth/callback`;

        const response = await fetch(`${accountUrl}/api/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                code_verifier: verifier
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error_description || 'Token exchange failed');
        }

        const data = await response.json();
        const { access_token, refresh_token } = data;

        // Clean up
        localStorage.removeItem('pkce_verifier');

        // Store Refresh Token
        if (refresh_token) {
            setRefreshToken(refresh_token);
        }

        // Login with Access Token
        await login(access_token);
        navigate('/', { replace: true });

      } catch (err) {
        console.error('AuthCallback: Unexpected error', err);
        setError(err instanceof Error ? err.message : '发生意外错误，请重试');
      }
    };

    handleAuthCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">登录失败</h1>
            <p className="text-gray-500">{error}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button onClick={() => redirectToAuth()}>
              重新登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">正在验证登录信息...</p>
      </div>
    </div>
  );
}
