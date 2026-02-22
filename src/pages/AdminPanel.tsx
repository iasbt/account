import { useEffect, useState } from 'react'
import { adminService, type AdminUser } from '../services/adminService'
import { useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Users, Settings, Search, Bell, Trash2, Edit2, X, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)

  // Modal States
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Edit Form State
  const [editForm, setEditForm] = useState({ username: '', email: '' })

  const fetchUsers = () => {
    setLoading(true)
    adminService.getUsers()
      .then(res => {
        if (res.success) {
          setUsers(res.users)
        }
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setActionLoading(true)
    try {
      await adminService.deleteUser(deletingUser.id)
      setUsers(users.filter(u => u.id !== deletingUser.id))
      setDeletingUser(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除失败'
      alert(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setActionLoading(true)
    try {
      await adminService.updateUser(editingUser.id, editForm)
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u))
      setEditingUser(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新失败'
      alert(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user)
    setEditForm({ username: user.username, email: user.email })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light text-text-secondary">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-border-light border-t-accent-blue rounded-full"></div>
        <p>正在加载系统...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background-light flex font-sans antialiased text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border-subtle flex-shrink-0 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border-subtle">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Admin System
          </h1>
          <p className="text-xs text-text-secondary mt-1">企业级管理后台</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-background-light text-accent-blue rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5" />
            <span>用户管理</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-background-light hover:text-text-primary rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5" />
            <span>系统设置</span>
          </button>
        </nav>

        <div className="p-4 border-t border-border-subtle space-y-2">
          <button 
            onClick={() => navigate('/')} 
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-light rounded-lg transition-colors"
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
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary">用户列表</h2>
            <p className="text-text-secondary mt-1">查看并管理系统内所有注册用户</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
               <Search className="absolute left-3 top-2.5 h-5 w-5 text-text-tertiary" />
               <input 
                 type="text" 
                 placeholder="搜索用户..." 
                 className="h-10 pl-10 pr-4 rounded-full border border-border-light bg-white text-sm focus:outline-none focus:border-accent-blue w-64 transition-all"
               />
             </div>
             <button className="h-10 w-10 flex items-center justify-center rounded-full border border-border-light bg-white hover:bg-background-light transition-colors">
               <Bell className="h-5 w-5 text-text-secondary" />
             </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
            错误: {error}
          </div>
        )}

        <div className="bg-white shadow-apple-card border border-border-subtle rounded-3xl overflow-hidden">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-background-light">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">用户 ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">账号信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">注册时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">用户类型</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background-light/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-text-tertiary font-mono">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-background-light border border-border-light flex items-center justify-center text-text-secondary font-bold text-sm mr-4">
                        {user.username.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{user.username}</div>
                        <div className="text-sm text-text-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-100">
                      普通用户
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setResettingUser(user)}
                        className="text-text-secondary hover:text-orange-500 transition-colors"
                        title="重置密码"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(user)}
                        className="text-text-secondary hover:text-accent-blue transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingUser(user)}
                        className="text-text-secondary hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-apple-deep p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">编辑用户</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-background-light rounded-full transition-colors">
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">用户名</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="w-full h-10 rounded-xl border border-border-light px-3 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full h-10 rounded-xl border border-border-light px-3 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-full border border-border-light text-text-secondary hover:bg-background-light transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-full bg-accent-blue text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-apple-deep p-6 animate-in fade-in zoom-in duration-200">
             <div className="flex flex-col items-center text-center mb-6">
               <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
                 <AlertTriangle className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-semibold text-text-primary mb-2">确认删除用户?</h3>
               <p className="text-text-secondary text-sm">
                 您确定要删除用户 <strong>{deletingUser.username}</strong> 吗？此操作无法撤销。
               </p>
             </div>
             
             <div className="flex gap-3">
               <button 
                 onClick={() => setDeletingUser(null)}
                 className="flex-1 h-10 rounded-full border border-border-light text-text-secondary hover:bg-background-light transition-colors font-medium"
               >
                 取消
               </button>
               <button 
                 onClick={handleDelete}
                 disabled={actionLoading}
                 className="flex-1 h-10 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
               >
                 {actionLoading ? '删除中...' : '确认删除'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-apple-deep p-6 animate-in fade-in zoom-in duration-200">
             <div className="flex flex-col items-center text-center mb-6">
               <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                 <RefreshCw className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-semibold text-text-primary mb-2">确认重置密码?</h3>
               <p className="text-text-secondary text-sm">
                 将发送包含重置链接的邮件给 <strong>{resettingUser.email}</strong>。
               </p>
             </div>
             
             <div className="flex gap-3">
               <button 
                 onClick={() => setResettingUser(null)}
                 className="flex-1 h-10 rounded-full border border-border-light text-text-secondary hover:bg-background-light transition-colors font-medium"
               >
                 取消
               </button>
               <button 
                 onClick={handleResetPassword}
                 disabled={actionLoading}
                 className="flex-1 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
               >
                 {actionLoading ? '发送中...' : '确认发送'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
