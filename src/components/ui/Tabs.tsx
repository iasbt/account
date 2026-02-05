type TabItem = {
  id: string
  label: string
}

type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-900/60 p-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={[
            'rounded-lg px-3 py-1.5 text-xs font-medium transition',
            value === item.id
              ? 'bg-cyan-500/20 text-cyan-200'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
