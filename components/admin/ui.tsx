import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import AdminHeader from './AdminHeader'

// Shared building blocks so every admin screen has the same calm look:
// one primary action per screen, quiet secondary actions, few borders, plenty of space.

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 bg-[#00CBB3] hover:bg-[#00B5A0] text-[#16123D] px-4 py-2 rounded-lg font-semibold text-sm transition-colors',
  secondary: 'inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors',
  ghost: 'inline-flex items-center justify-center gap-2 text-gray-300 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm transition-colors',
  icon: 'inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors',
}

export const panel = 'bg-white/[0.035] rounded-2xl ring-1 ring-white/[0.06]'

export function AdminPage({ children, width = 'max-w-6xl' }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="min-h-screen bg-[#16123D] text-white font-poppins pb-16">
      <AdminHeader />
      <main className={`${width} mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8`}>{children}</main>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="min-h-screen bg-[#16123D] flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-[#00CBB3]/20 border-t-[#00CBB3] rounded-full animate-spin" />
    </div>
  )
}

export function PageTitle({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[28px] font-oswald font-bold leading-tight text-white">{title}</h1>
        {subtitle && <div className="text-sm text-gray-400 mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[15px] font-poppins font-semibold text-white">{title}</h2>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// A single row of headline numbers, divided by hairlines instead of separate boxes
const COLS: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5' }

export function StatStrip({ items }: { items: { label: string; value: React.ReactNode; sub?: string }[] }) {
  return (
    <div className={`${panel} grid grid-cols-2 ${COLS[items.length] || 'sm:grid-cols-4'} divide-white/[0.06] sm:divide-x`}>
      {items.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <p className="text-xs text-gray-400">{s.label}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{s.value}</p>
          {s.sub && <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}

export function Progress({ value, max, color = '#00CBB3', className = '' }: { value: number; max: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 bg-white/[0.08] rounded-full overflow-hidden ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%`, backgroundColor: color }} />
    </div>
  )
}

export const PHASE_STYLE: Record<string, string> = {
  LIVE: 'bg-[#00CBB3]/15 text-[#00CBB3]',
  UPCOMING: 'bg-[#7600FF]/20 text-[#C9A2FF]',
  ENDED: 'bg-white/[0.06] text-gray-400',
}

export function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${PHASE_STYLE[phase] || PHASE_STYLE.ENDED}`}>
      {phase === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-[#00CBB3] animate-pulse" />}
      {phase === 'LIVE' ? 'Live' : phase === 'UPCOMING' ? 'Upcoming' : 'Ended'}
    </span>
  )
}

export function eventPhase(startDate: string, endDate: string) {
  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000
  return now < start ? 'UPCOMING' : now > end ? 'ENDED' : 'LIVE'
}

// A small dropdown for secondary actions, so toolbars keep one or two visible buttons
export function Menu({ label, icon, children, align = 'right' }: { label?: string; icon?: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={label ? btn.secondary : btn.icon} aria-haspopup="menu" aria-expanded={open} aria-label={label || 'More actions'}>
        {icon}
        {label}
        {label && <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={`absolute z-30 mt-2 min-w-[220px] py-1.5 rounded-xl bg-[#221B55] ring-1 ring-white/10 shadow-2xl shadow-black/40 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon: Icon, children, href, onClick, external, danger }: { icon?: React.ElementType; children: React.ReactNode; href?: string; onClick?: () => void; external?: boolean; danger?: boolean }) {
  const cls = `w-full flex items-center gap-3 px-3.5 py-2 text-sm text-left ${danger ? 'text-red-300 hover:bg-red-500/10' : 'text-gray-200 hover:bg-white/[0.06]'}`
  const inner = (
    <>
      {Icon && <Icon className={`w-4 h-4 ${danger ? '' : 'text-gray-400'}`} />}
      {children}
    </>
  )
  if (href) {
    return (
      <a href={href} className={cls} role="menuitem" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={cls} role="menuitem">
      {inner}
    </button>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className={`${panel} px-6 py-12 text-center`}>
      <p className="font-semibold text-white">{title}</p>
      {text && <p className="text-sm text-gray-400 mt-1.5 max-w-md mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

export const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}
