import {
  Aperture,
  Film,
  Image,
  LayoutGrid,
  MonitorPlay,
} from 'lucide-react'
import type { Application } from '../../../types/database.types'

const iconMap: Record<string, typeof Image> = {
  gallery: Image,
  lifeos: MonitorPlay,
  life_os: MonitorPlay,
  studio: Film,
  launcher: LayoutGrid,
  default: Aperture,
}

type AppCardProps = {
  app: Application
  onLaunch: (app: Application) => void
}

export function AppCard({ app, onLaunch }: AppCardProps) {
  const Icon = iconMap[app.code] ?? iconMap.default

  return (
    <button
      type="button"
      onClick={() => onLaunch(app)}
      className="group flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-left backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]"
    >
      {app.icon_url ? (
        <img
          src={app.icon_url}
          alt={app.name}
          className="h-12 w-12 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/60 text-cyan-200">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="text-sm font-semibold text-slate-100">{app.name}</div>
    </button>
  )
}
