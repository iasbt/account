import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const target = searchParams.get('target');
  const { logout } = useAuthStore();

  useEffect(() => {
    // 1. Clear local state (Token, User, Authenticated)
    logout();
    
    // 2. Clear any other potential storage if needed
    localStorage.removeItem('auth-storage'); // Force clear just in case

    // 3. Redirect
    const timer = setTimeout(() => {
      if (target) {
        // Simple validation for safety
        try {
          const url = new URL(target);
          const allowedHosts = [
            'localhost', 
            '127.0.0.1', 
            '119.91.71.30', 
            'account.iasbt.com'
          ];
          
          const isAllowed = allowedHosts.includes(url.hostname) || 
                            url.hostname.endsWith('.iasbt.com');
          
          if (isAllowed) {
            window.location.href = target;
            return;
          }
        } catch (e) {
          console.warn('Invalid target URL', e);
        }
      }
      
      // Default: Go to Login
      navigate('/login');
    }, 1000); // 1s delay to show feedback

    return () => clearTimeout(timer);
  }, [logout, target, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-gray-500 font-medium">正在安全退出...</p>
        {target && <p className="text-xs text-gray-400">即将跳转回应用</p>}
      </div>
    </div>
  );
}
