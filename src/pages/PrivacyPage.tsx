import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-xl font-semibold text-text-primary">隐私政策</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-12">
        <div className="bg-white p-10 rounded-3xl shadow-apple-card border border-border-subtle prose prose-slate max-w-none">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-accent-blue">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold m-0">隐私保护指引</h2>
              <p className="text-text-secondary text-sm mt-1">生效日期：2024年1月1日</p>
            </div>
          </div>

          <p className="lead text-lg text-text-secondary">
            IASBT（以下简称“我们”）深知个人信息对您的重要性，我们将按照法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
          </p>

          <h3>1. 我们如何收集和使用您的信息</h3>
          <p>
            在您使用我们的服务时，我们可能会收集您的姓名、电子邮箱、手机号码等信息，用于账号注册、身份验证及服务通知。我们承诺不会将您的个人信息出售给第三方。
          </p>

          <h3>2. 我们如何保护您的信息</h3>
          <p>
            我们使用符合业界标准的安全防护措施保护您提供的个人信息，防止数据遭到未经授权访问、公开披露、使用、修改、损坏或丢失。
          </p>

          <h3>3. Cookie 的使用</h3>
          <p>
            为确保网站正常运转，我们会在您的计算机或移动设备上存储名为 Cookie 的小数据文件。Cookie 通常包含标识符、站点名称以及一些号码和字符。
          </p>

          <h3>4. 您的权利</h3>
          <p>
            按照中国相关的法律、法规、标准，以及其他国家、地区的通行做法，我们保障您对自己的个人信息行使以下权利：访问、更正、删除您的个人信息。
          </p>

          <div className="mt-12 pt-8 border-t border-border-subtle text-center text-text-secondary text-sm">
            <p>如您对本隐私政策有任何疑问，请联系我们：privacy@iasbt.com</p>
          </div>
        </div>
      </main>
    </div>
  )
}
