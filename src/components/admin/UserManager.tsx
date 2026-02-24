
import { useEffect, useState } from 'react'
import { adminService, type AdminUser } from '../../services/adminService'
import { Search, Bell, Trash2, Edit2, X, RefreshCw } from 'lucide-react'

export default function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal States
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null)
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

  const handleResetPassword = async () => {
    if (!resettingUser) return
    setActionLoading(true)
    try {
      await adminService.resetUserPassword(resettingUser.id)
      alert('重置密码邮件已发送')
      setResettingUser(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '重置失败'
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
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="animate-spin h-8 w-8 border-4 border-border-light border-t-accent-blue rounded-full"></div>
      <p className="text-text-secondary">正在加载用户数据...</p>
    </div>
  )

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">用户列表</h2>
          <p className="text-sm text-gray-500 mt-1">查看并管理系统内所有注册用户</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
             <input 
               type="text" 
               placeholder="搜索用户..." 
               className="h-10 pl-10 pr-4 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 w-64 transition-all"
             />
           </div>
           <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
             <Bell className="h-5 w-5 text-gray-500" />
           </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
          错误: {error}
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户 ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">账号信息</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">注册时间</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户类型</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                  {user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm mr-4">
                      {user.username.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                      title="重置密码"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openEditModal(user)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setDeletingUser(user)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">编辑用户</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-70 flex items-center gap-2"
                >
                  {actionLoading && <RefreshCw className="animate-spin h-4 w-4" />}
                  保存更改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in duration-200">
             <div className="flex flex-col items-center text-center mb-6">
               <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
                 <Trash2 className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">确认删除用户?</h3>
               <p className="text-gray-500 text-sm">
                 此操作不可恢复。用户 <strong>{deletingUser.username}</strong> 将被永久删除。
               </p>
             </div>
             
             <div className="flex gap-3">
               <button 
                 onClick={() => setDeletingUser(null)}
                 className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
               >
                 取消
               </button>
               <button 
                 onClick={handleDelete}
                 disabled={actionLoading}
                 className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-70"
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
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in duration-200">
             <div className="flex flex-col items-center text-center mb-6">
               <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                 <RefreshCw className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">确认重置密码?</h3>
               <p className="text-gray-500 text-sm">
                 将发送包含重置链接的邮件给 <strong>{resettingUser.email}</strong>。
               </p>
             </div>
             
             <div className="flex gap-3">
               <button 
                 onClick={() => setResettingUser(null)}
                 className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
               >
                 取消
               </button>
               <button 
                 onClick={handleResetPassword}
                 disabled={actionLoading}
                 className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-70"
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
