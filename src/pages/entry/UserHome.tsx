import { useNavigate } from 'react-router-dom'

export default function UserHome() {
  const navigate = useNavigate()
  const photos = [
    { id: 1, title: '晨光', color: '#FDE68A' },
    { id: 2, title: '山谷', color: '#A7F3D0' },
    { id: 3, title: '海风', color: '#93C5FD' },
    { id: 4, title: '林间', color: '#86EFAC' },
    { id: 5, title: '晚霞', color: '#FCA5A5' },
    { id: 6, title: '街景', color: '#D1D5DB' },
    { id: 7, title: '静夜', color: '#C4B5FD' },
    { id: 8, title: '湖面', color: '#99F6E4' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">My Gallery</div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-200" />
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm font-semibold text-red-500 hover:text-red-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
        <section className="rounded-2xl bg-blue-50 px-6 py-10">
          <div className="text-2xl font-semibold">
            欢迎回来，探索你的私人图库
          </div>
          <div className="mt-2 text-sm text-gray-600">
            精选照片已为你整理，开始浏览吧
          </div>
        </section>

        <section className="space-y-4">
          <div className="text-lg font-semibold">最近上传</div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div
                  className="aspect-square"
                  style={{ backgroundColor: photo.color }}
                />
                <div className="px-3 py-2 text-sm font-medium text-gray-700">
                  {photo.title}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
