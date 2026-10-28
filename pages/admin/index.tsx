import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Activity,
  Plus,
  ArrowRight,
  Monitor,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Sparkles,
  Palette,
  Gamepad2,
  QrCode,
} from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import Funnel from '@/components/admin/Funnel'

interface EventSummary {
  id: string
  name: string
  venue: string | null
  startDate: string
  endDate: string
  themeColor: string
  bannerImage: string | null
  phase: 'LIVE' | 'UPCOMING' | 'ENDED'
  zones: number
  totals: { registered: number; started: number; completedAll: number; scans: number; pointsAwarded: number }
  topThree: { name: string; points: number }[]
  setup: { hasBranding: boolean; zones: number; zonesWithoutActivity: string[] }
  lastActivityAt: string | null
}

interface Overview {
  isSuper: boolean
  totals: { events: number; liveEvents: number; zones: number; registered: number; started: number; completedAll: number; scans: number; pointsAwarded: number }
  events: EventSummary[]
  recent: { name: string; zoneName: string; points: number; at: string; eventName: string; eventId: string }[]
}

const PHASE_STYLE: Record<EventSummary['phase'], string> = {
  LIVE: 'bg-[#00CBB3]/20 text-[#00CBB3]',
  UPCOMING: 'bg-[#7600FF]/25 text-[#C9A2FF]',
  ENDED: 'bg-white/10 text-gray-300',
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}

// What the organiser should do next for an event, in setup order
function nextStep(e: EventSummary): { label: string; href: string } | null {
  if (!e.setup.hasBranding) return { label: 'Add banner & registration form', href: `/admin/campaign/${e.id}/branding` }
  if (e.setup.zones === 0) return { label: 'Add your first booth', href: `/admin/campaign/${e.id}?tab=booths` }
  if (e.setup.zonesWithoutActivity.length > 0)
    return { label: `Add an activity to ${e.setup.zonesWithoutActivity.length} booth${e.setup.zonesWithoutActivity.length > 1 ? 's' : ''}`, href: `/admin/campaign/${e.id}?tab=booths` }
  if (e.totals.registered === 0) return { label: 'Print QR signs & share the registration link', href: `/admin/campaign/${e.id}/print` }
  return null
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (session?.user?.role === 'ATTENDEE') router.push('/passport')
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role === 'ATTENDEE') return
    const load = () =>
      fetch('/api/stats/overview')
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed to load the dashboard')
          setData(await r.json())
          setLoadError('')
        })
        .catch((err) => setLoadError(err.message))
        .finally(() => setLoading(false))
    load()
    // Keep live numbers fresh while the dashboard is open
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [status, session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  const t = data?.totals
  const canCreate = data?.isSuper

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-12">
      <AdminHeader />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-oswald font-bold">Welcome back, {session?.user?.name?.split(' ')[0]}!</h1>
            <p className="text-gray-300 text-sm mt-1">
              {t && t.liveEvents > 0
                ? `${t.liveEvents} event${t.liveEvents > 1 ? 's are' : ' is'} live right now.`
                : 'Everything across your events, in one place.'}
            </p>
          </div>
          {canCreate && (
            <Link
              href="/admin/events?new=1"
              className="flex items-center justify-center gap-2 bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-5 py-2.5 rounded-lg font-semibold"
            >
              <Plus className="w-5 h-5" /> New event
            </Link>
          )}
        </div>

        {loadError && (
          <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-sm">{loadError}. Retrying shortly.</div>
        )}

        {t && (
          <>
            {/* Totals across every event */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Kpi icon={Calendar} color="#00CBB3" label="Events" value={t.events} hint={`${t.liveEvents} live`} />
              <Kpi icon={MapPin} color="#7600FF" label="Booths" value={t.zones} />
              <Kpi icon={Users} color="#FFB800" label="Registered" value={t.registered} />
              <Kpi icon={Activity} color="#F96A32" label="Started passport" value={t.started} hint={`${pct(t.started, t.registered)}% of registered`} />
              <Kpi icon={Flag} color="#16A34A" label="Completed all booths" value={t.completedAll} hint={`${pct(t.completedAll, t.started)}% of starters`} />
              <Kpi icon={Trophy} color="#E11D48" label="Points awarded" value={t.pointsAwarded.toLocaleString()} hint={`${t.scans} booth visits`} />
            </div>

            {t.registered > 0 && (
              <section className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">Engagement funnel, all events</h2>
                <Funnel steps={[
                  { label: 'Registered', value: t.registered },
                  { label: 'Started (1+ booth)', value: t.started },
                  { label: 'Completed every booth', value: t.completedAll },
                ]} />
              </section>
            )}
          </>
        )}

        {data && data.events.length === 0 && <GettingStarted canCreate={!!canCreate} />}

        {data && data.events.length > 0 && (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
            <section>
              <h2 className="text-lg font-oswald font-bold mb-3">Your events</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {data.events.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            </section>

            <aside className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00CBB3] animate-pulse" /> Live activity
              </h2>
              {data.recent.length === 0 ? (
                <p className="text-sm text-gray-400">Booth completions show up here as attendees play.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent.map((r, i) => (
                    <li key={i} className="text-sm">
                      <p>
                        <strong>{r.name}</strong> completed <span className="text-[#00CBB3]">{r.zoneName}</span>
                        {r.points > 0 && <span className="text-[#FFB800]"> +{r.points}</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.eventName} · {timeAgo(r.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

function Kpi({ icon: Icon, color, label, value, hint }: { icon: React.ElementType; color: string; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  )
}

function EventCard({ e }: { e: EventSummary }) {
  const step = nextStep(e)
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
      <div className="h-1.5" style={{ backgroundColor: e.themeColor }} />
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/admin/campaign/${e.id}`} className="font-oswald font-bold text-lg leading-tight hover:underline">
              {e.name}
            </Link>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {fmt(e.startDate)} – {fmt(e.endDate)}
              {e.venue && ` · ${e.venue}`}
            </p>
          </div>
          <span className={`text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${PHASE_STYLE[e.phase]}`}>{e.phase}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <Mini label="Booths" value={e.zones} />
          <Mini label="Registered" value={e.totals.registered} />
          <Mini label="Started" value={e.totals.started} />
          <Mini label="Finished" value={e.totals.completedAll} />
        </div>

        {e.topThree.length > 0 && (
          <div className="text-xs text-gray-300 flex flex-wrap gap-x-3 gap-y-1">
            {e.topThree.map((p, i) => (
              <span key={p.name}>
                {['🥇', '🥈', '🥉'][i]} {p.name} <span className="text-[#FFB800]">{p.points}</span>
              </span>
            ))}
          </div>
        )}

        {step ? (
          <Link href={step.href} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFD36B] hover:bg-[#FFB800]/15">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Next: {step.label}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[#00CBB3]">
            <CheckCircle2 className="w-4 h-4" /> Ready to run
          </p>
        )}

        <div className="flex gap-2 mt-auto">
          <Link href={`/admin/campaign/${e.id}`} className="flex-1 text-center text-sm font-semibold py-2 rounded-lg bg-white/10 hover:bg-white/15">
            Manage
          </Link>
          <Link href={`/admin/campaign/${e.id}?tab=analytics`} className="flex items-center justify-center gap-1.5 px-3 text-sm rounded-lg border border-white/15 hover:bg-white/5" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </Link>
          <a href={`/screen/${e.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 text-sm rounded-lg border border-white/15 hover:bg-white/5" title="Open leaderboard screen">
            <Monitor className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-lg py-2">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function GettingStarted({ canCreate }: { canCreate: boolean }) {
  const steps = [
    { icon: Calendar, title: 'Create the event', text: 'Name, dates and venue.' },
    { icon: Palette, title: 'Brand it', text: 'Banner, colours and the registration form.' },
    { icon: MapPin, title: 'Add booths', text: 'One per touchpoint, each with its own QR code and points.' },
    { icon: Gamepad2, title: 'Give each booth an activity', text: 'Quiz, poll, survey, download, video, raffle or link.' },
    { icon: QrCode, title: 'Print QR codes & share the link', text: 'Attendees register and start collecting points.' },
    { icon: Monitor, title: 'Put the leaderboard on the big screen', text: 'It updates live as people play.' },
  ]
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-6 h-6 text-[#FFB800]" />
        <h2 className="text-xl font-oswald font-bold">Set up your first event in six steps</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        {canCreate ? 'Each step points you to the next one as you go.' : 'A super admin needs to give you access to an event first.'}
      </p>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#00CBB3]/15 text-[#00CBB3] font-bold text-sm flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <div>
              <p className="font-semibold text-sm flex items-center gap-2">
                <s.icon className="w-4 h-4 text-gray-400" /> {s.title}
              </p>
              <p className="text-xs text-gray-400 mt-1">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {canCreate && (
        <Link href="/admin/events?new=1" className="inline-flex items-center gap-2 bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-5 py-3 rounded-lg font-semibold">
          <Plus className="w-5 h-5" /> Create your first event
        </Link>
      )}
    </section>
  )
}
