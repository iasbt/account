import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Users, Settings, Box, Mail } from 'lucide-react'
import { useAdminStore } from '../store/useAdminStore'
import UserManager from '../components/admin/UserManager'
import AppManager from '../components/admin/AppManager'
import SystemManager from '../components/admin/SystemManager'
import EmailManager from '../components/admin/EmailManager'

type Tab = 'users' | 'apps' | 'settings' | 'email'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const navigate = useNavigate()
  const logout = useAdminStore(state => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans antialiased text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Admin System
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">企业级统一身份认证管理</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'users' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>用户管理</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('apps')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'apps' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Box className="w-5 h-5" />
            <span>应用接入</span>
          </button>

          <button 
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'email' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Mail className="w-5 h-5" />
            <span>邮件服务</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>系统设置</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <button 
            onClick={() => navigate('/')} 
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>返回前台应用</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出管理系统</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'users' && <UserManager />}
          {activeTab === 'apps' && <AppManager />}
          {activeTab === 'email' && <EmailManager />}
          {activeTab === 'settings' && <SystemManager />}
        </div>
      </main>
    </div>
  )
}

