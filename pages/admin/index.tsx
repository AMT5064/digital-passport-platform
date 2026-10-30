import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Plus, ChevronRight, ArrowRight } from 'lucide-react'
import { AdminPage, EmptyState, PageTitle, PhaseBadge, Progress, Section, Spinner, StatStrip, btn, panel, pct, timeAgo } from '@/components/admin/ui'

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

// The one thing an organiser should do next for an event, in setup order
function nextStep(e: EventSummary): { label: string; href: string } | null {
  if (!e.setup.hasBranding) return { label: 'Add branding', href: `/admin/campaign/${e.id}/branding` }
  if (e.setup.zones === 0) return { label: 'Add booths', href: `/admin/campaign/${e.id}?tab=booths` }
  if (e.setup.zonesWithoutActivity.length > 0) return { label: `${e.setup.zonesWithoutActivity.length} booth${e.setup.zonesWithoutActivity.length > 1 ? 's need' : ' needs'} an activity`, href: `/admin/campaign/${e.id}?tab=booths` }
  if (e.totals.registered === 0) return { label: 'Print QR signs', href: `/admin/campaign/${e.id}/print` }
  return null
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
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

  if (status === 'loading' || loading) return <Spinner />

  const t = data?.totals
  const canCreate = data?.isSuper
  const events = data?.events || []
  // Live first, then upcoming, then past events
  const order = { LIVE: 0, UPCOMING: 1, ENDED: 2 }
  const sorted = [...events].sort((a, b) => order[a.phase] - order[b.phase])

  return (
    <AdminPage>
      <PageTitle
        title={`${greeting()}, ${session?.user?.name?.split(' ')[0] || 'there'}`}
        subtitle={
          t
            ? t.liveEvents > 0
              ? `${t.liveEvents} of your ${t.events} events ${t.liveEvents > 1 ? 'are' : 'is'} live right now.`
              : `${t.events} event${t.events === 1 ? '' : 's'}, none live right now.`
            : undefined
        }
        actions={
          canCreate && (
            <Link href="/admin/events?new=1" className={btn.primary}>
              <Plus className="w-4 h-4" /> New event
            </Link>
          )
        }
      />

      {loadError && <p className="text-sm text-red-300">{loadError}. Retrying shortly.</p>}

      {events.length === 0 && data && <GettingStarted canCreate={!!canCreate} />}

      {t && events.length > 0 && (
        <StatStrip
          items={[
            { label: 'Registered', value: t.registered.toLocaleString(), sub: 'across all events' },
            { label: 'Playing', value: t.started.toLocaleString(), sub: `${pct(t.started, t.registered)}% of registered` },
            { label: 'Finished every booth', value: t.completedAll.toLocaleString(), sub: `${pct(t.completedAll, t.started)}% of players` },
            { label: 'Booth visits', value: t.scans.toLocaleString(), sub: `${t.zones} booths in total` },
          ]}
        />
      )}

      {events.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start [&>*]:min-w-0">
          <Section title="Events">
            <div className={`${panel} divide-y divide-white/[0.06] overflow-hidden`}>
              {sorted.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </div>
          </Section>

          <Section title="Latest activity">
            {data!.recent.length === 0 ? (
              <p className="text-sm text-gray-500">Booth completions appear here as people play.</p>
            ) : (
              <ul className="space-y-4">
                {data!.recent.slice(0, 6).map((r, i) => (
                  <li key={i} className="text-sm leading-snug">
                    <p className="text-gray-200">
                      <span className="font-medium text-white">{r.name}</span> · {r.zoneName}
                      {r.points > 0 && <span className="text-[#FFB800]"> +{r.points}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.eventName} · {timeAgo(r.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </AdminPage>
  )
}

function EventRow({ e }: { e: EventSummary }) {
  const step = nextStep(e)
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return (
    <div className="relative flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
      <span className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: e.themeColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* The whole row is clickable through this link */}
          <Link href={`/admin/campaign/${e.id}`} className="font-semibold text-white hover:text-white after:absolute after:inset-0 truncate">
            {e.name}
          </Link>
          <PhaseBadge phase={e.phase} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {fmt(e.startDate)} – {fmt(e.endDate)}
          {e.venue && ` · ${e.venue}`}
        </p>
        {step && (
          <Link href={step.href} className="relative z-10 inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#FFD36B] hover:text-[#FFE39B]">
            Next: {step.label} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="hidden sm:block w-40 flex-shrink-0">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">
            <span className="text-white font-medium">{e.totals.started}</span> / {e.totals.registered} playing
          </span>
        </div>
        <Progress value={e.totals.completedAll} max={e.totals.registered} color={e.themeColor} />
        <p className="text-[11px] text-gray-500 mt-1">{e.totals.completedAll} finished</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </div>
  )
}

function GettingStarted({ canCreate }: { canCreate: boolean }) {
  const steps = [
    { title: 'Create and brand the event', text: 'Dates, venue, banner, colours and the registration form.' },
    { title: 'Add booths with activities', text: 'Each booth gets a QR code, points and a quiz, poll or other task.' },
    { title: 'Print signs and go live', text: 'Attendees scan, collect points and climb the big-screen leaderboard.' },
  ]
  if (!canCreate) return <EmptyState title="No events yet" text="A super admin needs to give you access to an event." />
  return (
    <div className={`${panel} p-6 sm:p-8`}>
      <h2 className="text-lg font-poppins font-semibold text-white">Set up your first event</h2>
      <ol className="grid sm:grid-cols-3 gap-6 mt-6">
        {steps.map((s, i) => (
          <li key={s.title}>
            <span className="text-xs font-semibold text-[#00CBB3]">Step {i + 1}</span>
            <p className="font-medium text-white mt-1">{s.title}</p>
            <p className="text-sm text-gray-400 mt-1">{s.text}</p>
          </li>
        ))}
      </ol>
      <Link href="/admin/events?new=1" className={`${btn.primary} mt-8`}>
        <Plus className="w-4 h-4" /> Create event
      </Link>
    </div>
  )
}
