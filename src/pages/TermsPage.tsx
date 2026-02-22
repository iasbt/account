import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background-light text-text-primary font-sans antialiased">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-border-subtle px-6 py-4">
        <div className="mx-auto flex max-w-[800px] items-center gap-4">
          <Link 
            to="/" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background-light border border-border-light transition hover:bg-border-subtle text-text-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">服务条款</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-12">
        <div className="bg-white p-10 rounded-3xl shadow-apple-card border border-border-subtle prose prose-slate max-w-none">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold m-0">用户服务协议</h2>
              <p className="text-text-secondary text-sm mt-1">更新日期：2024年1月1日</p>
            </div>
          </div>

          <p className="lead text-lg text-text-secondary">
            欢迎您使用 IASBT 提供的服务。请您仔细阅读以下条款，如果您对本协议的任何条款表示异议，您可以选择不进入 IASBT。
          </p>

          <h3>1. 服务内容</h3>
          <p>
            IASBT 服务的具体内容由我们根据实际情况提供，包括但不限于个人中心、授权管理、数据统计等。我们保留随时变更、中断或终止部分或全部网络服务的权利。
          </p>

          <h3>2. 用户账号</h3>
          <p>
            您在使用本服务时可能需要注册一个账号。您有责任妥善保管注册账号信息及密码安全，您需要对注册账号以及密码下的行为承担法律责任。
          </p>

          <h3>3. 用户行为规范</h3>
          <p>
            用户在使用本服务过程中，必须遵循以下原则：
            <ul>
              <li>遵守中国有关的法律和法规；</li>
              <li>不得为任何非法目的而使用网络服务系统；</li>
              <li>遵守所有与网络服务有关的网络协议、规定和程序；</li>
              <li>不得利用本服务进行任何可能对互联网正常运转造成不利影响的行为。</li>
            </ul>
          </p>

          <h3>4. 知识产权</h3>
          <p>
            IASBT 提供的网络服务中包含的任何文本、图片、图形、音频和/或视频资料均受版权、商标和/或其它财产所有权法律的保护，未经相关权利人同意，上述资料均不得在任何媒体直接或间接发布、播放、出于播放或发布目的而改写或再发行。
          </p>

          <div className="mt-12 pt-8 border-t border-border-subtle text-center text-text-secondary text-sm">
            <p>最终解释权归 IASBT 所有</p>
          </div>
        </div>
      </main>
    </div>
  )
}
