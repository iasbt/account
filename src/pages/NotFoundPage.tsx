import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background-light text-text-primary flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-background-card shadow-apple-card text-text-secondary">
          <FileQuestion className="h-10 w-10" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          页面未找到
        </h1>
        
        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
          抱歉，您访问的页面不存在或已被移动。请检查链接是否正确。
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-blue px-8 py-3 text-white font-medium hover:bg-accent-hover transition-colors shadow-apple-hover active:scale-[0.98]"
        >
          <ArrowLeft className="h-5 w-5" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
