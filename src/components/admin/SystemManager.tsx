
import { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import { Server, Mail, Activity, Database, CheckCircle, AlertCircle, RefreshCw, Send } from 'lucide-react'

interface SystemStatus {
  nodeVersion: string
  uptime: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  dbConnection: string
  environment: string
  smtp: {
    host: string
    port: number
    user: string
  }
}

export default function SystemManager() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailForm, setEmailForm] = useState({ email: '', type: 'register' })
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await adminService.getSystemStatus()
      if (res.success) {
        setStatus(res.status)
      }
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: '无法获取系统状态' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email) return

    setSending(true)
    setMessage(null)
    try {
      const res = await adminService.sendTestEmail(emailForm.email, emailForm.type)
      if (res.success) {
        setMessage({ type: 'success', text: res.message })
      } else {
        setMessage({ type: 'error', text: res.message })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '发送失败' })
    } finally {
      setSending(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }

  if (loading && !status) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">系统概览</h2>
        <button 
          onClick={fetchStatus} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新状态
        </button>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Environment</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{status?.environment}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Node {status?.nodeVersion}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Uptime</p>
              <p className="text-lg font-bold text-gray-900">{status ? formatUptime(status.uptime) : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Database</p>
              <p className={`text-lg font-bold ${status?.dbConnection === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {status?.dbConnection === 'connected' ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Memory (RSS)</p>
              <p className="text-lg font-bold text-gray-900">{status ? formatBytes(status.memoryUsage.rss) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Service Test */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">邮件服务测试</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            SMTP Host: {status?.smtp.host}:{status?.smtp.port} ({status?.smtp.user})
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSendTestEmail} className="max-w-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">测试目标邮箱</label>
              <input 
                type="email" 
                required
                value={emailForm.email}
                onChange={e => setEmailForm({...emailForm, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件模板类型</label>
              <select 
                value={emailForm.type}
                onChange={e => setEmailForm({...emailForm, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="register">注册验证码 (Register)</option>
                <option value="reset_password">重置密码验证码 (Reset Password Code)</option>
                <option value="reset_link">重置密码链接 (Reset Password Link)</option>
                <option value="general">通用通知 (General)</option>
              </select>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={sending || !emailForm.email}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? '发送中...' : '发送测试邮件'}
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
