
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SsoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const calledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 2. 如果未登录，RequreAuth 应该已经重定向了，但这里再次确认
    if (!isAuthenticated) {
      // 如果是被 RequireAuth 拦截，这里的逻辑实际上不会执行
      return;
    }

    // Stop if target parameter is present (Legacy Implicit Flow) - handled by render logic
    if (searchParams.get('target')) {
      return;
    }

    // 3. 处理 OAuth 2.0 Authorize 请求
    const client_id = searchParams.get('client_id');
    const redirect_uri = searchParams.get('redirect_uri');
    const response_type = searchParams.get('response_type');
    const scope = searchParams.get('scope') || undefined;
    const state = searchParams.get('state') || undefined;
    const code_challenge = searchParams.get('code_challenge') || undefined;
    const code_challenge_method = searchParams.get('code_challenge_method') as 'S256' | undefined;

    if (!client_id || !redirect_uri || response_type !== 'code') {
      setTimeout(() => {
        setError("Invalid OAuth Request: Missing client_id, redirect_uri, or response_type=code");
      }, 0);
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    const authorizeParams = new URLSearchParams();
    authorizeParams.set('client_id', client_id);
    authorizeParams.set('redirect_uri', redirect_uri);
    authorizeParams.set('response_type', 'code');
    if (scope) authorizeParams.set('scope', scope);
    if (state) authorizeParams.set('state', state);
    if (code_challenge) authorizeParams.set('code_challenge', code_challenge);
    if (code_challenge_method) authorizeParams.set('code_challenge_method', code_challenge_method);

    window.location.href = `/api/oauth/authorize?${authorizeParams.toString()}`;
  }, [searchParams, isAuthenticated, navigate]);

  // 1. Check Legacy Implicit Flow (target) - Fail Fast
  const target = searchParams.get('target');
  if (target) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authorization Error</h2>
          <p className="text-sm text-gray-600 mb-6">Implicit Flow (target parameter) is deprecated. Please use OAuth 2.0 Authorization Code Flow (/oauth/authorize).</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authorization Error</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Authorizing application...</p>
        <p className="text-xs text-gray-400">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
