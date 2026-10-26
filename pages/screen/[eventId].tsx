import React, { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Maximize, Minimize, Trophy, Zap, Megaphone, MapPin, Users, Flag } from 'lucide-react'

interface Player {
  rank: number
  name: string
  company: string | null
  points: number
  zonesCompleted: number
  zonePoints: Record<string, number>
  finished: boolean
}

interface Feed {
  event: { id: string; name: string; themeColor: string; logo: string | null; bannerImage: string | null }
  zones: { id: string; name: string; points: number }[]
  totals: { registered: number; started: number; completedAll: number; scans: number }
  leaderboard: Player[]
  inProgress: { name: string; zonesLeft: number; points: number }[]
  recent: { name: string; zoneName: string; points: number; at: string }[]
}

const REFRESH_MS = 10000
const MEDALS = ['#FFD54A', '#C9D1DB', '#E8954A']

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

// Big-screen leaderboard for one event. Public link, no sign-in, refreshes itself.
export default function LeaderboardScreen() {
  const router = useRouter()
  const eventId = typeof router.query.eventId === 'string' ? router.query.eventId : ''
  const [feed, setFeed] = useState<Feed | null>(null)
  const [error, setError] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const previous = useRef<Record<string, number>>({})

  const load = useCallback(async () => {
    if (!eventId) return
    try {
      const res = await fetch(`/api/screen/${eventId}`)
      if (!res.ok) throw new Error(res.status === 404 ? 'Event not found' : 'Could not load the leaderboard')
      const data: Feed = await res.json()
      // Flash rows whose points went up since the last refresh
      const moved = new Set(data.leaderboard.filter((p) => previous.current[p.name] !== undefined && previous.current[p.name] !== p.points).map((p) => p.name))
      previous.current = Object.fromEntries(data.leaderboard.map((p) => [p.name, p.points]))
      setChanged(moved)
      setFeed(data)
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }, [eventId])

  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen().catch(() => {})
  }

  if (!feed) {
    return (
      <div className="min-h-screen bg-[#0B0A1A] text-white flex items-center justify-center">
        {error ? <p className="text-xl text-red-300">{error}</p> : <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin" />}
      </div>
    )
  }

  const color = feed.event.themeColor || '#00CBB3'
  const board = feed.leaderboard
  const podium = board.slice(0, 3)
  const zoneTotal = feed.zones.length
  const leader = board[0]

  // Encouragement lines, rotated through the shout-out panel and ticker
  const shoutouts: string[] = []
  if (board[1] && leader) shoutouts.push(`${board[1].name} is ${leader.points - board[1].points + 1} pts away from the top spot!`)
  if (board[2] && board[1]) shoutouts.push(`${board[2].name} needs ${board[1].points - board[2].points + 1} pts to move up to #2`)
  for (const p of feed.inProgress.slice(0, 4)) {
    shoutouts.push(`${p.name} has ${p.zonesLeft} booth${p.zonesLeft > 1 ? 's' : ''} to go. Keep going!`)
  }
  if (feed.totals.completedAll > 0) shoutouts.push(`${feed.totals.completedAll} player${feed.totals.completedAll > 1 ? 's have' : ' has'} completed every booth`)

  const ticker = [
    ...(leader ? [`${leader.name.toUpperCase()} IS LEADING WITH ${leader.points.toLocaleString()} PTS`] : []),
    ...feed.recent.slice(0, 6).map((r) => `${r.name.toUpperCase()} JUST COMPLETED ${r.zoneName.toUpperCase()}${r.points ? ` +${r.points}` : ''}`),
    ...shoutouts.map((s) => s.toUpperCase()),
  ]

  return (
    <div className="min-h-screen bg-[#0B0A1A] text-white font-poppins flex flex-col overflow-hidden" style={{ backgroundImage: `radial-gradient(ellipse at top, ${color}22, transparent 60%)` }}>
      <Head>
        <title>{`${feed.event.name} · Leaderboard`}</title>
      </Head>

      {/* Title bar */}
      <header className="flex items-center gap-4 px-6 lg:px-10 py-4 border-b border-white/10">
        {feed.event.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={feed.event.logo} alt="" className="h-10 w-10 object-contain rounded" />
        )}
        <h1 className="flex-1 min-w-0 text-2xl lg:text-4xl font-oswald font-bold tracking-wide uppercase truncate">
          {feed.event.name} <span style={{ color }}>· Leaderboard</span>
        </h1>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <span className="flex items-center gap-2"><Users className="w-4 h-4" style={{ color }} /> {feed.totals.started} playing</span>
          <span className="flex items-center gap-2"><Flag className="w-4 h-4" style={{ color }} /> {feed.totals.completedAll} finished</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>
        </div>
        <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
          {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </header>

      {/* Ticker */}
      {ticker.length > 0 && (
        <div className="border-b border-white/10 bg-white/[0.03] overflow-hidden whitespace-nowrap py-2.5">
          <div className="inline-block animate-[ticker_40s_linear_infinite] font-oswald tracking-wider text-sm lg:text-base">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="mx-8 inline-flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color }} /> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 grid grid-cols-1 xl:grid-cols-[300px_1fr_320px] gap-0 min-h-0">
        {/* Live rankings */}
        <aside className="hidden xl:block border-r border-white/10 p-5 overflow-hidden">
          <h2 className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color }} /> LIVE RANKINGS
          </h2>
          <ol className="space-y-2">
            {board.slice(0, 12).map((p) => (
              <li
                key={p.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${changed.has(p.name) ? 'bg-white/15' : 'bg-white/[0.04]'}`}
                style={{ borderColor: p.rank <= 3 ? `${MEDALS[p.rank - 1]}66` : 'rgba(255,255,255,0.08)' }}
              >
                <span className="w-6 text-lg font-bold text-center" style={{ color: p.rank <= 3 ? MEDALS[p.rank - 1] : '#9CA3AF' }}>{p.rank}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold truncate">{p.name}</span>
                  <span className="block text-[11px] text-gray-500 truncate">{p.finished ? 'All booths done' : `${p.zonesCompleted}/${zoneTotal} booths`}</span>
                </span>
                <span className="font-bold tabular-nums" style={{ color: p.rank <= 3 ? MEDALS[p.rank - 1] : 'white' }}>{p.points.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </aside>

        {/* Podium and table */}
        <section className="p-5 lg:p-8 overflow-hidden flex flex-col gap-6 min-w-0">
          {board.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <Trophy className="w-20 h-20" style={{ color }} />
              <p className="text-3xl font-oswald font-bold">Be the first on the board!</p>
              <p className="text-gray-400 text-lg">Scan the QR code at any booth to start your passport.</p>
            </div>
          ) : (
            <>
              <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-400">✦ TOP 3 CHAMPIONS ✦</p>
              <div className="grid grid-cols-3 gap-3 lg:gap-6 items-end max-w-5xl mx-auto w-full">
                {[1, 0, 2].map((i) => {
                  const p = podium[i]
                  if (!p) return <div key={i} />
                  const first = i === 0
                  return (
                    <div
                      key={p.name}
                      className={`rounded-2xl border text-center px-3 ${first ? 'py-8 lg:py-10' : 'py-6'} transition-all`}
                      style={{
                        borderColor: `${MEDALS[i]}88`,
                        background: `linear-gradient(180deg, ${MEDALS[i]}22, transparent)`,
                        boxShadow: first ? `0 0 40px ${MEDALS[i]}33` : undefined,
                      }}
                    >
                      <p className="text-[11px] font-bold tracking-[0.25em] mb-3" style={{ color: MEDALS[i] }}>
                        {['1ST', '2ND', '3RD'][i]} PLACE
                      </p>
                      <div
                        className={`mx-auto rounded-full flex items-center justify-center font-bold border-2 mb-3 ${first ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-xl'}`}
                        style={{ borderColor: MEDALS[i], color: MEDALS[i], backgroundColor: `${MEDALS[i]}1A` }}
                      >
                        {initials(p.name)}
                      </div>
                      <p className={`font-oswald font-bold truncate ${first ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'}`}>{p.name}</p>
                      {p.company && <p className="text-xs text-gray-400 truncate">{p.company}</p>}
                      <p className={`font-bold tabular-nums mt-2 ${first ? 'text-5xl lg:text-6xl' : 'text-3xl lg:text-4xl'}`} style={{ color: MEDALS[i] }}>
                        {p.points.toLocaleString()}
                      </p>
                      <p className="text-[11px] tracking-[0.2em] text-gray-400">POINTS</p>
                    </div>
                  )
                })}
              </div>

              {/* Points by booth */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm lg:text-base">
                  <thead>
                    <tr className="text-[11px] tracking-[0.15em] text-gray-400 border-b border-white/10">
                      <th className="text-left px-4 py-3">#</th>
                      <th className="text-left px-4 py-3">PLAYER</th>
                      {feed.zones.map((z) => (
                        <th key={z.id} className="px-2 py-3 text-center hidden md:table-cell" title={z.name}>
                          {z.name.length > 12 ? z.name.slice(0, 11).toUpperCase() + '…' : z.name.toUpperCase()}
                        </th>
                      ))}
                      <th className="text-right px-4 py-3">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.slice(0, 8).map((p) => (
                      <tr key={p.name} className={`border-b border-white/5 last:border-0 transition-colors ${changed.has(p.name) ? 'bg-white/10' : ''}`}>
                        <td className="px-4 py-3 font-bold" style={{ color: p.rank <= 3 ? MEDALS[p.rank - 1] : '#9CA3AF' }}>{p.rank}</td>
                        <td className="px-4 py-3 font-semibold truncate max-w-[240px]">{p.name}</td>
                        {feed.zones.map((z) => (
                          <td key={z.id} className="px-2 py-3 text-center tabular-nums hidden md:table-cell">
                            {z.id in p.zonePoints ? <span style={{ color }}>{p.zonePoints[z.id]}</span> : <span className="text-gray-600">–</span>}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-lg" style={{ color: p.rank <= 3 ? MEDALS[p.rank - 1] : 'white' }}>
                          {p.points.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Shout-outs and booth guide */}
        <aside className="hidden xl:flex flex-col gap-6 border-l border-white/10 p-5 overflow-hidden">
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4" style={{ color }} /> LIVE SHOUTOUTS
            </h2>
            {shoutouts.length === 0 ? (
              <p className="text-sm text-gray-500">Shout-outs appear as players race for the top.</p>
            ) : (
              <ul className="space-y-2">
                {shoutouts.slice(0, 6).map((s) => (
                  <li key={s} className="text-sm px-3 py-2.5 rounded-lg border" style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color }} /> BOOTHS TO VISIT
            </h2>
            <ul className="space-y-1.5">
              {feed.zones.map((z) => (
                <li key={z.id} className="flex justify-between text-sm px-3 py-2 rounded-lg bg-white/[0.04]">
                  <span className="truncate">{z.name}</span>
                  <span className="font-bold ml-2" style={{ color }}>{z.points} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="border-t border-white/10 py-3 text-center text-xs lg:text-sm tracking-[0.15em] text-gray-400 font-oswald">
        🏆 SCAN ANY BOOTH QR TO JOIN · COMPLETE ALL {zoneTotal} BOOTHS TO MAX YOUR SCORE · UPDATES LIVE
      </footer>

      <style jsx global>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
