import { AppCard } from './AppCard'
import { useAppLauncher } from '../hooks/useAppLauncher'

function AppCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
      <div className="h-12 w-12 rounded-xl bg-slate-800/70" />
      <div className="h-4 w-24 rounded bg-slate-800/70" />
    </div>
  )
}

export function AppGrid() {
  const { apps, loading, error, launchApp } = useAppLauncher()

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <AppCardSkeleton key={`skeleton-${index}`} />
            ))
          : apps.map((app) => (
              <AppCard key={app.id} app={app} onLaunch={launchApp} />
            ))}
      </div>
    </div>
  )
}
