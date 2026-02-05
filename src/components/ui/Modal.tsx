import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-950/70"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
