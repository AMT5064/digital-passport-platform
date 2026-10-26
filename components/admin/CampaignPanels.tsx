import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight, Monitor, Download, Copy, Trophy, Users, Activity, Flag, MapPin, Star } from 'lucide-react'
import Funnel from './Funnel'

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

const card = 'bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6'
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

export function ExportButtons({ eventId, types }: { eventId: string; types: { type: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((t) => (
        <a
          key={t.type}
          href={`/api/export?eventId=${eventId}&type=${t.type}`}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-white/15 hover:bg-white/5"
        >
          <Download className="w-4 h-4 text-[#00CBB3]" /> {t.label}
        </a>
      ))}
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="flex gap-2">
        <input readOnly value={value} className="flex-1 min-w-0 px-3 py-2 bg-[#16123D]/60 border border-white/15 rounded-lg text-xs font-mono" />
        <button
          onClick={() => {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="px-3 rounded-lg border border-white/15 hover:bg-white/5 text-xs flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

// Guides an organiser through setup in order, always pointing at the next thing to do
export function SetupChecklist({ eventId, stats }: { eventId: string; stats: CampaignStats }) {
  const { setup, totals } = stats
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const steps = [
    { done: true, title: 'Create the event', text: 'Name, dates and venue are set.', href: '/admin/events', cta: 'Edit details' },
    { done: setup.hasBranding, title: 'Brand it & design registration', text: 'Banner, colours and the fields attendees fill in.', href: `/admin/campaign/${eventId}/branding`, cta: 'Open branding' },
    { done: setup.zones > 0, title: 'Add booths', text: 'One per touchpoint. Each gets its own QR code and points.', href: `/admin/campaign/${eventId}/zones/new`, cta: 'Add a booth' },
    {
      done: setup.zones > 0 && setup.zonesWithoutActivity.length === 0,
      title: 'Give every booth an activity',
      text: setup.zonesWithoutActivity.length ? `Missing: ${setup.zonesWithoutActivity.join(', ')}` : 'Quiz, poll, survey, download, video, raffle or link.',
      href: `/admin/campaign/${eventId}/activities/new`,
      cta: 'Add an activity',
    },
    { done: totals.registered > 0, title: 'Print QR codes & share the registration link', text: 'Download each booth QR from the Zones tab.', href: `/admin/campaign/${eventId}?tab=zones`, cta: 'Get QR codes' },
    { done: totals.scans > 0, title: 'Go live', text: 'Put the leaderboard on a big screen and watch it fill up.', href: `/screen/${eventId}`, cta: 'Open screen', external: true },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-oswald font-bold">Setup checklist</h3>
          <p className="text-xs text-gray-400">{doneCount === steps.length ? 'All set. Your event is running.' : `${doneCount} of ${steps.length} done`}</p>
        </div>
        <div className="w-28 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#00CBB3] rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="space-y-2">
        {steps.map((s) => {
          const isNext = s === next
          const Cta = s.external ? 'a' : Link
          return (
            <li
              key={s.title}
              className={`flex items-start gap-3 p-3 rounded-lg ${isNext ? 'bg-[#FFB800]/10 border border-[#FFB800]/30' : 'border border-transparent'}`}
            >
              {s.done ? <CheckCircle2 className="w-5 h-5 text-[#00CBB3] flex-shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${s.done ? 'text-gray-300' : 'text-white'}`}>
                  {s.title} {isNext && <span className="text-[11px] text-[#FFD36B] font-normal ml-1">Next step</span>}
                </p>
                <p className="text-xs text-gray-400">{s.text}</p>
              </div>
              <Cta
                href={s.href}
                {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${isNext ? 'text-[#FFD36B]' : 'text-[#00CBB3]'}`}
              >
                {s.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Cta>
            </li>
          )
        })}
      </ol>
      {origin && (
        <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/10">
          <CopyField label="Registration link (share before the event)" value={`${origin}/register?event=${eventId}`} />
          <CopyField label="Leaderboard screen (open on the projector)" value={`${origin}/screen/${eventId}`} />
        </div>
      )}
    </div>
  )
}

export function StatTiles({ stats }: { stats: CampaignStats }) {
  const t = stats.totals
  const tiles = [
    { icon: Users, color: '#FFB800', label: 'Registered', value: t.registered },
    { icon: Activity, color: '#F96A32', label: 'Started', value: t.started, hint: `${pct(t.started, t.registered)}% of registered` },
    { icon: Flag, color: '#16A34A', label: 'Completed all booths', value: t.completedAll, hint: `${pct(t.completedAll, t.started)}% of starters` },
    { icon: MapPin, color: '#7600FF', label: 'Booth visits', value: t.scans },
    { icon: Trophy, color: '#E11D48', label: 'Points awarded', value: t.pointsAwarded.toLocaleString(), hint: `max ${t.maxPoints} per person` },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((x) => (
        <div key={x.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <x.icon className="w-5 h-5 mb-2" style={{ color: x.color }} />
          <p className="text-2xl font-bold leading-none">{x.value}</p>
          <p className="text-xs text-gray-400 mt-1.5">{x.label}</p>
          {x.hint && <p className="text-[11px] text-gray-500">{x.hint}</p>}
        </div>
      ))}
    </div>
  )
}

export function LeaderboardPanel({ eventId, stats }: { eventId: string; stats: CampaignStats }) {
  const players = stats.leaderboard.filter((p) => p.zonesCompleted > 0)
  const notStarted = stats.leaderboard.length - players.length
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-oswald font-bold">Leaderboard</h3>
          <p className="text-xs text-gray-400">
            {players.length} playing{notStarted > 0 && ` · ${notStarted} registered but not started yet`}. Ties go to whoever got there first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/screen/${eventId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[#00CBB3] text-[#16123D] font-semibold">
            <Monitor className="w-4 h-4" /> Project on big screen
          </a>
          <ExportButtons eventId={eventId} types={[{ type: 'leaderboard', label: 'Export CSV' }]} />
        </div>
      </div>

      {players.length === 0 ? (
        <div className={card + ' text-center text-sm text-gray-400'}>Nobody has completed a booth yet. Rankings appear here as soon as someone does.</div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-white/10">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Participant</th>
                {stats.zones.map((z) => (
                  <th key={z.id} className="px-3 py-3 text-center whitespace-nowrap" title={z.name}>
                    {z.name.length > 14 ? z.name.slice(0, 13) + '…' : z.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Booths</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.userId} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-bold">{p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : p.rank}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.company || p.email}</p>
                  </td>
                  {stats.zones.map((z) => (
                    <td key={z.id} className="px-3 py-3 text-center">
                      {z.id in p.zonePoints ? <span className={p.zonePoints[z.id] > 0 ? 'text-[#00CBB3]' : 'text-gray-400'}>{p.zonePoints[z.id]}</span> : <span className="text-gray-600">·</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-gray-300">
                    {p.zonesCompleted}/{stats.zones.length}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#FFB800]">{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AnalyticsPanel({ eventId, stats }: { eventId: string; stats: CampaignStats }) {
  const t = stats.totals
  const maxVisits = Math.max(1, ...stats.zones.map((z) => z.visits))
  const maxDay = Math.max(1, ...stats.registrationsByDay.map((d) => d.count))
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-oswald font-bold">Campaign analytics</h3>
        <ExportButtons
          eventId={eventId}
          types={[
            { type: 'participants', label: 'Participants' },
            { type: 'responses', label: 'Responses' },
            { type: 'booths', label: 'Booth stats' },
            { type: 'leaderboard', label: 'Leaderboard' },
          ]}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className={card}>
          <h4 className="text-sm font-semibold text-gray-300 mb-4">Engagement funnel</h4>
          <Funnel
            steps={[
              { label: 'Registered', value: t.registered },
              { label: 'Started (1+ booth)', value: t.started },
              { label: 'Completed every booth', value: t.completedAll },
            ]}
          />
        </div>
        <div className={card}>
          <h4 className="text-sm font-semibold text-gray-300 mb-4">Visits by booth</h4>
          {stats.zones.length === 0 ? (
            <p className="text-sm text-gray-400">No booths yet.</p>
          ) : (
            <div className="space-y-3">
              {[...stats.zones]
                .sort((a, b) => b.visits - a.visits)
                .map((z) => (
                  <div key={z.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{z.name}</span>
                      <span className="text-gray-400 flex-shrink-0 ml-2">
                        {z.visits} · {pct(z.visits, t.registered)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00CBB3] rounded-full" style={{ width: `${(z.visits / maxVisits) * 100}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {stats.registrationsByDay.length > 0 && (
        <div className={card}>
          <h4 className="text-sm font-semibold text-gray-300 mb-4">Registrations by day</h4>
          <div className="flex items-end gap-2 h-32">
            {stats.registrationsByDay.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                <span className="text-xs text-gray-300">{d.count}</span>
                <div className="w-full max-w-[48px] bg-[#7600FF] rounded-t" style={{ height: `${(d.count / maxDay) * 90}px` }} />
                <span className="text-[10px] text-gray-500 truncate">{new Date(d.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Activity results</h4>
        {stats.activityResults.length === 0 ? (
          <div className={card + ' text-sm text-gray-400'}>Results show here once booths have activities and attendees complete them.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {stats.activityResults.map((r) => (
              <div key={r.zoneId} className={card}>
                <p className="text-xs text-gray-400">
                  {r.zoneName} · {r.type}
                </p>
                <p className="font-semibold mb-3">{r.title}</p>
                <p className="text-sm text-gray-300 mb-3">{r.completions} completed</p>
                {r.quiz && r.completions > 0 && (
                  <div className="space-y-1">
                    <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
                      <div className="bg-[#16A34A]" style={{ width: `${pct(r.quiz.correct, r.completions)}%` }} />
                      <div className="bg-red-500/70" style={{ width: `${pct(r.quiz.wrong, r.completions)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {pct(r.quiz.correct, r.completions)}% answered correctly ({r.quiz.correct} right, {r.quiz.wrong} wrong)
                    </p>
                  </div>
                )}
                {r.options && <Bars items={r.options.map((o) => ({ label: o.text, count: o.count }))} total={r.completions} />}
                {r.questions?.map((q) => (
                  <div key={q.text} className="mt-3">
                    <p className="text-xs font-semibold text-gray-300 mb-1 flex items-center gap-2">
                      {q.text}
                      {q.average !== undefined && (
                        <span className="text-[#FFB800] flex items-center gap-1">
                          <Star className="w-3 h-3" /> avg {q.average}
                        </span>
                      )}
                    </p>
                    {q.type === 'TEXT' || q.type === 'PARAGRAPH' ? (
                      <p className="text-xs text-gray-400">{q.answers.length} written answers (see Responses export)</p>
                    ) : (
                      <Bars items={q.answers.slice(0, 6).map((a) => ({ label: a.value, count: a.count }))} total={r.completions} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-300">Latest responses</h4>
          <ExportButtons eventId={eventId} types={[{ type: 'responses', label: 'All responses' }]} />
        </div>
        {stats.responses.length === 0 ? (
          <div className={card + ' text-sm text-gray-400'}>No responses yet.</div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-white/10">
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Booth</th>
                  <th className="px-4 py-3">Answer</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {stats.responses.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.company || r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{r.zone}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-md">{r.answer}</td>
                    <td className="px-4 py-3 text-right text-[#FFB800]">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Bars({ items, total }: { items: { label: string; count: number }[]; total: number }) {
  return (
    <div className="space-y-2">
      {items.map((o) => (
        <div key={o.label}>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="truncate">{o.label}</span>
            <span className="text-gray-400 ml-2">
              {o.count} · {pct(o.count, total)}%
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#7600FF] rounded-full" style={{ width: `${pct(o.count, total)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
