import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function SsoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const target = searchParams.get('target');
  const { isAuthenticated } = useAuthStore();
  const calledRef = useRef(false);

  useEffect(() => {
    // 1. 如果没有 target，回首页
    if (!target) {
      navigate('/');
      return;
    }

    // 2. 如果未登录，回登录页 (带上 redirect)
    // 注意：RequireAuth 应该已经处理了这步，但为了保险双重检查
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(`/sso/issue?target=${encodeURIComponent(target)}`);
      navigate(`/login?redirect=${redirect}`);
      return;
    }

    // 3. 调用后端 API 获取跳转 URL
    if (calledRef.current) return;
    calledRef.current = true;

    const issueToken = async () => {
      try {
        const { url } = await authService.issueSsoToken(target);
        if (url) {
          window.location.href = url;
        } else {
          console.error('No URL returned from SSO issue');
          navigate('/');
        }
      } catch (error) {
        console.error('SSO Error:', error);
        // 如果 API 返回 401，可能是 Token 过期，强行踢回登录页
        // 这里简单处理：回首页
        navigate('/');
      }
    };

    issueToken();
  }, [target, navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">正在验证身份并跳转...</p>
        <p className="text-xs text-gray-400">Target: {target}</p>
      </div>
    </div>
  );
}
