import { useHandleSignInCallback, useLogto } from '@logto/react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function CallbackPage() {
  const navigate = useNavigate()
  const { signIn } = useLogto()
  const { isLoading, error } = useHandleSignInCallback(() => {
    navigate('/', { replace: true })
  })

  if (error) {
    const message = error instanceof Error ? error.message : '登录失败，请重试'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">登录失败</h1>
            <p className="text-gray-500 break-all">{message}</p>
          </div>
          <div className="flex gap-4">
            <button
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => navigate('/')}
            >
              返回首页
            </button>
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => void signIn(`${window.location.origin}/callback`)}
            >
              重新登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">正在跳转...</p>
        </div>
      </div>
    )
  }

  return null
}
