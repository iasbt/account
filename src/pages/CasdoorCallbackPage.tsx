import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function CasdoorCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleCallback = useAuthStore((state) => state.handleCallback);
  const code = searchParams.get('code');
  const [status, setStatus] = useState(() => code ? '正在连接身份认证中心...' : '错误：未检测到授权码，请重新登录');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    
    if (!code) {
      return;
    }

    processedRef.current = true;

    const processLogin = async () => {
      try {
        setStatus('正在验证身份凭证...');
        setErrorDetail(null);
        await handleCallback(code);
        setStatus('登录成功，正在跳转...');

        // 4. 检查是否有自动跳转目标
        const redirectTarget = sessionStorage.getItem('auth_redirect_target');
        if (redirectTarget) {
          sessionStorage.removeItem('auth_redirect_target');
          console.log('Auto-redirecting to:', redirectTarget);
          window.location.href = redirectTarget;
          return;
        }

        // 5. 默认跳转到仪表盘
        navigate('/', { replace: true });
      } catch (error: unknown) {
        console.error('Login failed:', error);
        setStatus('登录失败');
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setErrorDetail(message);
        processedRef.current = false; // Allow retry if needed
      }
    };

    processLogin();
  }, [code, navigate, handleCallback]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-2xl max-w-md w-full">
        {status.includes('失败') || status.includes('错误') ? (
          <div className="text-red-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse"></div>
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin relative z-10" />
          </div>
        )}
        
        <div className="text-center space-y-2 w-full">
          <h2 className="text-lg font-medium text-slate-200">Unified Account</h2>
          <p className={`text-sm ${status.includes('失败') ? 'text-red-400 font-bold' : 'text-slate-400 animate-pulse'}`}>
            {status}
          </p>
          
          {errorDetail && (
            <div className="mt-4 p-3 bg-red-950/50 border border-red-900/50 rounded text-xs text-red-300 break-all text-left font-mono max-h-40 overflow-y-auto">
              {errorDetail}
            </div>
          )}
          
          {(status.includes('失败') || status.includes('错误')) && (
            <button 
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-200 transition-colors border border-slate-700"
            >
              返回登录页
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
