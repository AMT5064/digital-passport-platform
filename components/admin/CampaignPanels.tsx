import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Monitor, Download, Copy, Star, ChevronDown, Search } from 'lucide-react'
import { EmptyState, Menu, MenuItem, Progress, Section, StatStrip, btn, panel, pct, timeAgo } from './ui'

// Shapes returned by /api/stats/event
export interface CampaignStats {
  event: { id: string; name: string; themeColor: string; bannerImage: string | null }
  zones: { id: string; name: string; qrSlug: string; points: number; activityType: string | null; activityTitle: string | null; visits: number }[]
  totals: { registered: number; started: number; completedAll: number; scans: number; pointsAwarded: number; maxPoints: number }
  leaderboard: {
    rank: number
    userId: string
    name: string
    email: string
    company: string | null
    points: number
    zonesCompleted: number
    zonePoints: Record<string, number>
    lastActivityAt: string | null
    durationMinutes: number | null
    tied: boolean
  }[]
  recent: { name: string; zoneName: string; points: number; at: string }[]
  registrationsByDay: { day: string; count: number }[]
  setup: { hasBranding: boolean; zones: number; zonesWithoutActivity: string[] }
  activityResults: {
    zoneId: string
    zoneName: string
    type: string
    title: string
    completions: number
    quiz?: { correct: number; wrong: number }
    options?: { text: string; count: number }[]
    questions?: { text: string; type: string; answers: { value: string; count: number }[]; average?: number }[]
  }[]
  responses: { name: string; email: string; company: string; zone: string; activity: string; type: string; answer: string; points: number; at: string }[]
}

const EXPORTS = [
  { type: 'leaderboard', label: 'Leaderboard' },
  { type: 'participants', label: 'Participants & registration answers' },
  { type: 'responses', label: 'Activity responses' },
  { type: 'booths', label: 'Booth stats' },
]

// All CSV downloads behind one button
export function ExportMenu({ eventId, only }: { eventId: string; only?: string[] }) {
  const items = only ? EXPORTS.filter((e) => only.includes(e.type)) : EXPORTS
  if (items.length === 1) {
    return (
      <a href={`/api/export?eventId=${eventId}&type=${items[0].type}`} className={btn.secondary}>
        <Download className="w-4 h-4" /> Export CSV
      </a>
    )
  }
  return (
    <Menu label="Export" icon={<Download className="w-4 h-4" />}>
      {items.map((e) => (
        <MenuItem key={e.type} href={`/api/export?eventId=${eventId}&type=${e.type}`}>
          {e.label}
        </MenuItem>
      ))}
    </Menu>
  )
}

function setupSteps(eventId: string, stats: CampaignStats) {
  const { setup, totals } = stats
  return [
    { done: true, title: 'Create the event', href: `/admin/events?edit=${eventId}`, cta: 'Edit details' },
    { done: setup.hasBranding, title: 'Add branding and design the registration form', href: `/admin/campaign/${eventId}/branding`, cta: 'Open branding' },
    { done: setup.zones > 0, title: 'Add booths', href: `/admin/campaign/${eventId}?tab=booths`, cta: 'Add booths' },
    {
      done: setup.zones > 0 && setup.zonesWithoutActivity.length === 0,
      title: setup.zonesWithoutActivity.length ? `Add an activity to ${setup.zonesWithoutActivity.join(', ')}` : 'Give every booth an activity',
      href: `/admin/campaign/${eventId}?tab=booths`,
      cta: 'Open booths',
    },
    { done: totals.registered > 0, title: 'Print QR signs and share the registration link', href: `/admin/campaign/${eventId}/print`, cta: 'Print signs' },
    { done: totals.scans > 0, title: 'Open the leaderboard on the big screen', href: `/screen/${eventId}`, cta: 'Open screen', external: true },
  ]
}

// Shown only while setup is unfinished: the next step stands out, the rest are a quiet list
function SetupCard({ eventId, stats }: { eventId: string; stats: CampaignStats }) {
  const steps = setupSteps(eventId, stats)
  const doneCount = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  const [showAll, setShowAll] = useState(false)
  if (!next) return null
  const Cta = next.external ? 'a' : Link
  return (
    <div className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400">
          Setup · {doneCount} of {steps.length} done
        </p>
        <Progress value={doneCount} max={steps.length} className="w-32" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <p className="text-lg font-medium text-white">{next.title}</p>
        <Cta href={next.href} {...(next.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={btn.primary}>
          {next.cta} <ArrowRight className="w-4 h-4" />
        </Cta>
      </div>
      <button onClick={() => setShowAll(!showAll)} className="mt-4 text-xs text-gray-400 hover:text-white inline-flex items-center gap-1">
        {showAll ? 'Hide' : 'Show'} all steps <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
      </button>
      {showAll && (
        <ol className="mt-3 space-y-2">
          {steps.map((s) => (
            <li key={s.title} className="flex items-center gap-3 text-sm">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-[#00CBB3]/15 text-[#00CBB3]' : 'ring-1 ring-white/20'}`}>
                {s.done && <Check className="w-3 h-3" />}
              </span>
              <span className={s.done ? 'text-gray-500' : 'text-gray-200'}>{s.title}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function CopyLink({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 truncate font-mono">{value.replace(/^https?:\/\//, '')}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className={btn.ghost}
      >
        {copied ? <Check className="w-4 h-4 text-[#00CBB3]" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

// The event's home tab: what to do next, the headline numbers, and who is winning
export function OverviewPanel({ eventId, stats, onTab }: { eventId: string; stats: CampaignStats; onTab: (tab: string) => void }) {
  const t = stats.totals
  const top = stats.leaderboard.filter((p) => p.zonesCompleted > 0).slice(0, 5)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return (
    <div className="space-y-8">
      <SetupCard eventId={eventId} stats={stats} />

      <StatStrip
        items={[
          { label: 'Registered', value: t.registered },
          { label: 'Playing', value: t.started, sub: `${pct(t.started, t.registered)}% of registered` },
          { label: 'Finished every booth', value: t.completedAll, sub: `${pct(t.completedAll, t.started)}% of players` },
          { label: 'Booth visits', value: t.scans, sub: `${stats.zones.length} booths` },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-8 [&>*]:min-w-0">
        <Section
          title="Top players"
          action={
            top.length > 0 && (
              <button onClick={() => onTab('leaderboard')} className="text-xs text-gray-400 hover:text-white">
                Full leaderboard →
              </button>
            )
          }
        >
          {top.length === 0 ? (
            <p className="text-sm text-gray-500">Rankings appear once someone completes a booth.</p>
          ) : (
            <ol className={`${panel} divide-y divide-white/[0.06]`}>
              {top.map((p) => (
                <li key={p.userId} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-6 text-center text-gray-400 tabular-nums">{p.rank}</span>
                  <span className="flex-1 min-w-0 truncate text-white">{p.name}</span>
                  <span className="text-xs text-gray-500">
                    {p.zonesCompleted}/{stats.zones.length} booths
                  </span>
                  <span className="w-14 text-right font-semibold text-[#FFB800] tabular-nums">{p.points}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Latest activity">
          {stats.recent.length === 0 ? (
            <p className="text-sm text-gray-500">Booth completions appear here as people play.</p>
          ) : (
            <ul className={`${panel} divide-y divide-white/[0.06]`}>
              {stats.recent.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="flex-1 min-w-0 truncate text-gray-200">
                    <span className="text-white">{r.name}</span> · {r.zoneName}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {origin && (
        <Section title="Share">
          <div className={`${panel} px-5 divide-y divide-white/[0.06]`}>
            <CopyLink label="Registration link" value={`${origin}/register?event=${eventId}`} />
            <CopyLink label="Big-screen leaderboard" value={`${origin}/screen/${eventId}`} />
          </div>
        </Section>
      )}

      <RunOfShow eventId={eventId} boothCount={stats.zones.length} />
    </div>
  )
}

// The on-the-ground checklist, folded away until it's needed
function RunOfShow({ eventId, boothCount }: { eventId: string; boothCount: number }) {
  const items = [
    { when: 'Day before', text: `Print the signs: ${boothCount} booth${boothCount === 1 ? '' : 's'} plus the registration poster. Brief booth staff on how scanning works.` },
    { when: 'Setup', text: 'Put each sign at eye level by its booth and the poster at the entrance. Scan every sign with a phone to check it.' },
    { when: 'Setup', text: 'Open the big screen on the venue display and press full screen.' },
    { when: 'Live', text: 'Watch the leaderboard. A booth with few visits may need a better sign position.' },
    { when: 'After', text: 'Export participants and responses, then announce the winners.' },
  ]
  return (
    <details className={`${panel} group`}>
      <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-3">
        <span>
          <span className="text-[15px] font-semibold text-white">Event-day checklist</span>
          <span className="block text-xs text-gray-500 mt-0.5">What to do on the ground, in order</span>
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <ol className="px-5 pb-5 space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-4 text-sm">
            <span className="w-20 flex-shrink-0 text-xs text-gray-500 pt-0.5">{it.when}</span>
            <span className="text-gray-300">{it.text}</span>
          </li>
        ))}
        <li className="pt-2">
          <Link href={`/admin/campaign/${eventId}/print`} className={btn.secondary}>
            Print signs
          </Link>
        </li>
      </ol>
    </details>
  )
}

export function LeaderboardPanel({ eventId, stats }: { eventId: string; stats: CampaignStats }) {
  const players = useMemo(() => stats.leaderboard.filter((p) => p.zonesCompleted > 0), [stats])
  const notStarted = stats.leaderboard.length - players.length
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? players.filter((p) => `${p.name} ${p.email} ${p.company || ''}`.toLowerCase().includes(q)) : players
  }, [players, query])
  const booths = stats.zones.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {players.length} playing{notStarted > 0 && ` · ${notStarted} not started yet`}
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={`/screen/${eventId}`} target="_blank" rel="noopener noreferrer" className={btn.primary}>
            <Monitor className="w-4 h-4" /> Show on big screen
          </a>
          <ExportMenu eventId={eventId} only={['leaderboard']} />
        </div>
      </div>

      {players.length === 0 ? (
        <EmptyState title="No rankings yet" text="Rankings appear as soon as someone completes a booth." />
      ) : (
        <>
          {players.length > 10 && <SearchBox value={query} onChange={setQuery} placeholder="Search players" />}
          <div className={`${panel} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-medium w-12">#</th>
                  <th className="px-3 py-3 font-medium">Player</th>
                  <th className="px-3 py-3 font-medium w-48 hidden md:table-cell">Booths</th>
                  <th className="px-3 py-3 font-medium hidden sm:table-cell">Reached score</th>
                  <th className="px-5 py-3 font-medium text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {shown.map((p) => (
                  <tr key={p.userId} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 tabular-nums text-gray-400">{p.rank}</td>
                    <td className="px-3 py-3">
                      <p className="text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.company || p.email}</p>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {/* One segment per booth, filled once that booth is done */}
                      <div className="flex gap-0.5" title={stats.zones.map((z) => `${z.name}: ${z.id in p.zonePoints ? 'done' : 'not yet'}`).join('\n')}>
                        {stats.zones.map((z) => (
                          <span key={z.id} className={`h-1.5 flex-1 rounded-full ${z.id in p.zonePoints ? 'bg-[#00CBB3]' : 'bg-white/10'}`} />
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {p.zonesCompleted} of {booths}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400 hidden sm:table-cell whitespace-nowrap">
                      {p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '–'}
                      {p.tied && <span className="ml-2 text-[#FFD36B]">tied</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-[#FFB800] tabular-nums">{p.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">Equal points: whoever reached the score first ranks higher, then whoever played fastest.</p>
        </>
      )}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative max-w-xs w-full">
      <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg text-sm text-white placeholder-gray-500 focus:ring-[#00CBB3]/60 focus:outline-none"
      />
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = { QUIZ: 'Quiz', POLL: 'Poll', SURVEY: 'Survey', DOWNLOAD: 'Download', VIDEO: 'Video', RAFFLE: 'Raffle', CUSTOM_CTA: 'Link' }

export function AnalyticsPanel({ eventId, stats }: { eventId: string; stats: CampaignStats }) {
  const t = stats.totals
  const maxVisits = Math.max(1, ...stats.zones.map((z) => z.visits))
  const maxDay = Math.max(1, ...stats.registrationsByDay.map((d) => d.count))
  const funnel = [
    { label: 'Registered', value: t.registered },
    { label: 'Played at least one booth', value: t.started },
    { label: 'Finished every booth', value: t.completedAll },
  ]
  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <ExportMenu eventId={eventId} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 [&>*]:min-w-0">
        <Section title="Engagement" hint="How far attendees got">
          <div className={`${panel} p-5 space-y-4`}>
            {funnel.map((s, i) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{s.label}</span>
                  <span className="text-white tabular-nums">
                    {s.value}
                    {i > 0 && <span className="text-gray-500"> · {pct(s.value, t.registered)}%</span>}
                  </span>
                </div>
                <Progress value={s.value} max={Math.max(1, t.registered)} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Visits by booth" hint="Share of registered attendees who visited">
          {stats.zones.length === 0 ? (
            <p className="text-sm text-gray-500">No booths yet.</p>
          ) : (
            <div className={`${panel} p-5 space-y-4`}>
              {[...stats.zones]
                .sort((a, b) => b.visits - a.visits)
                .map((z) => (
                  <div key={z.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="truncate text-gray-300">{z.name}</span>
                      <span className="text-white flex-shrink-0 ml-2 tabular-nums">
                        {z.visits} <span className="text-gray-500">· {pct(z.visits, t.registered)}%</span>
                      </span>
                    </div>
                    <Progress value={z.visits} max={maxVisits} color="#7C6BFF" />
                  </div>
                ))}
            </div>
          )}
        </Section>
      </div>

      {stats.registrationsByDay.length > 1 && (
        <Section title="Registrations by day">
          <div className={`${panel} p-5`}>
            <div className="flex items-end gap-2 h-28">
              {stats.registrationsByDay.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                  <span className="text-[11px] text-gray-400 tabular-nums">{d.count}</span>
                  <div className="w-full max-w-[40px] bg-[#7C6BFF] rounded" style={{ height: `${(d.count / maxDay) * 72}px` }} />
                  <span className="text-[10px] text-gray-500 truncate">{new Date(d.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section title="Activity results">
        {stats.activityResults.length === 0 ? (
          <p className="text-sm text-gray-500">Results appear once attendees complete booth activities.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {stats.activityResults.map((r) => (
              <div key={r.zoneId} className={`${panel} p-5`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs text-gray-500 truncate">
                    {r.zoneName} · {TYPE_LABEL[r.type] || r.type}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-nowrap">{r.completions} done</p>
                </div>
                <p className="font-medium text-white mt-1 mb-4">{r.title}</p>
                {r.quiz && r.completions > 0 && (
                  <div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.08]">
                      <div className="bg-[#00CBB3]" style={{ width: `${pct(r.quiz.correct, r.completions)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {pct(r.quiz.correct, r.completions)}% answered correctly ({r.quiz.correct} of {r.completions})
                    </p>
                  </div>
                )}
                {r.options && <Bars items={r.options.map((o) => ({ label: o.text, count: o.count }))} total={r.completions} />}
                {r.questions?.map((q) => (
                  <div key={q.text} className="mt-4 first:mt-0">
                    <p className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                      {q.text}
                      {q.average !== undefined && (
                        <span className="text-[#FFB800] inline-flex items-center gap-1">
                          <Star className="w-3 h-3" /> {q.average}
                        </span>
                      )}
                    </p>
                    {q.type === 'TEXT' || q.type === 'PARAGRAPH' ? (
                      <p className="text-xs text-gray-500">{q.answers.length} written answers, in the responses export</p>
                    ) : (
                      <Bars items={q.answers.slice(0, 5).map((a) => ({ label: a.value, count: a.count }))} total={r.completions} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Latest responses" action={stats.responses.length > 10 && <ExportMenu eventId={eventId} only={['responses']} />}>
        {stats.responses.length === 0 ? (
          <p className="text-sm text-gray-500">No responses yet.</p>
        ) : (
          <div className={`${panel} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-medium">Who</th>
                  <th className="px-3 py-3 font-medium">Booth</th>
                  <th className="px-3 py-3 font-medium">Answer</th>
                  <th className="px-5 py-3 font-medium text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {stats.responses.slice(0, 10).map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-5 py-3 text-white whitespace-nowrap">{r.name}</td>
                    <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{r.zone}</td>
                    <td className="px-3 py-3 text-gray-300 max-w-md">{r.answer}</td>
                    <td className="px-5 py-3 text-right text-[#FFB800] tabular-nums">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

function Bars({ items, total }: { items: { label: string; count: number }[]; total: number }) {
  return (
    <div className="space-y-2.5">
      {items.map((o) => (
        <div key={o.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="truncate text-gray-300">{o.label}</span>
            <span className="text-gray-500 ml-2 tabular-nums">{pct(o.count, total)}%</span>
          </div>
          <Progress value={o.count} max={total} color="#7C6BFF" />
        </div>
      ))}
    </div>
  )
}
