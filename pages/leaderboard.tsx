import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import { ArrowLeft, Trophy, QrCode, Flag } from 'lucide-react'

interface Row {
  rank: number
  userName: string
  company: string | null
  points: number
  zonesCompleted: number
  finished: boolean
  tied: boolean
  isMe: boolean
}

interface Board {
  event: { id: string; name: string; themeColor: string; bannerImage: string | null }
  zoneTotal: number
  players: number
  finishers: number
  top: Row[]
  me: Row | null
}

const MEDALS = ['#FFD54A', '#C9D1DB', '#E8954A']

export default function LeaderboardPage() {
  const router = useRouter()
  const eventId = typeof router.query.eventId === 'string' ? router.query.eventId : ''
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!eventId) return
    try {
      const res = await axios.get('/api/leaderboard', { params: { eventId } })
      setBoard(res.data.data)
      setError('')
    } catch {
      setError('Could not load the leaderboard')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (!router.isReady) return
    if (!eventId) {
      setLoading(false)
      return
    }
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [router.isReady, eventId, load])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!eventId || !board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center px-4 text-white text-center">
        <div>
          <Trophy className="w-14 h-14 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-6">{error || 'Scan your first booth to join the event leaderboard'}</p>
          <Link href="/passport" className="inline-block bg-[#00CBB3] text-[#16123D] px-6 py-2.5 rounded-lg font-semibold">
            Back to my passport
          </Link>
        </div>
      </div>
    )
  }

  const color = board.event.themeColor || '#00CBB3'
  const me = board.me
  const meInTop = me && board.top.some((r) => r.isMe)
  const above = me && me.rank > 1 ? board.top[me.rank - 2] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-10">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-[#16123D]/80">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/passport" className="p-2 -ml-2 hover:bg-white/10 rounded-lg" aria-label="Back to my passport">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-oswald font-bold leading-tight">Leaderboard</h1>
            <p className="text-xs text-gray-400 truncate">{board.event.name}</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Where you stand */}
        {me ? (
          <div className="rounded-2xl p-5 border" style={{ borderColor: `${color}66`, background: `linear-gradient(135deg, ${color}26, transparent)` }}>
            <p className="text-xs text-gray-300">Your position</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-4xl font-oswald font-bold">
                #{me.rank}
                <span className="text-base text-gray-400 font-normal"> of {board.players}</span>
              </p>
              <p className="text-2xl font-bold" style={{ color }}>{me.points} pts</p>
            </div>
            <p className="text-sm text-gray-200 mt-3">
              {me.rank === 1
                ? me.tied
                  ? `You're tied for the lead, and you got there first!${me.finished ? '' : ' One more booth would put you clear.'}`
                  : "You're in the lead! Keep visiting booths to stay there."
                : above
                  ? above.points === me.points
                    ? `Tied with ${above.userName.split(' ')[0]} on points, but they got there first.`
                    : `${above.points - me.points} pts behind ${above.userName.split(' ')[0]} at #${me.rank - 1}.`
                  : 'Keep going!'}
              {!me.finished && ` ${board.zoneTotal - me.zonesCompleted} booth${board.zoneTotal - me.zonesCompleted > 1 ? 's' : ''} left to visit.`}
            </p>
            {!me.finished && (
              <Link href="/scan" className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[#16123D]" style={{ backgroundColor: color }}>
                <QrCode className="w-5 h-5" /> Scan the next booth
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 text-sm text-gray-300">
            Complete a booth to get on the board. Every booth earns points.
          </div>
        )}

        <div className="flex gap-3 text-center">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3">
            <p className="text-xl font-bold">{board.players}</p>
            <p className="text-[11px] text-gray-400">Playing</p>
          </div>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3">
            <p className="text-xl font-bold flex items-center justify-center gap-1">
              <Flag className="w-4 h-4" style={{ color }} /> {board.finishers}
            </p>
            <p className="text-[11px] text-gray-400">Finished every booth</p>
          </div>
        </div>

        <ol className="space-y-2">
          {board.top.map((r) => (
            <Rank key={`${r.rank}-${r.userName}`} r={r} color={color} zoneTotal={board.zoneTotal} />
          ))}
          {me && !meInTop && (
            <>
              <li className="text-center text-gray-500 text-xs py-1">···</li>
              <Rank r={me} color={color} zoneTotal={board.zoneTotal} />
            </>
          )}
        </ol>
      </main>
    </div>
  )
}

function Rank({ r, color, zoneTotal }: { r: Row; color: string; zoneTotal: number }) {
  const medal = r.rank <= 3 ? MEDALS[r.rank - 1] : null
  return (
    <li
      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{
        borderColor: r.isMe ? color : medal ? `${medal}55` : 'rgba(255,255,255,0.08)',
        backgroundColor: r.isMe ? `${color}1F` : 'rgba(255,255,255,0.04)',
      }}
    >
      <span className="w-7 text-center font-bold text-lg" style={{ color: medal || '#9CA3AF' }}>
        {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate">
          {r.userName} {r.isMe && <span className="text-xs font-normal" style={{ color }}>(you)</span>}
        </span>
        <span className="block text-xs text-gray-400">
          {r.finished ? 'All booths done 🎉' : `${r.zonesCompleted}/${zoneTotal} booths`}
          {r.tied && ' · tied on points'}
        </span>
      </span>
      <span className="font-bold tabular-nums">{r.points}</span>
    </li>
  )
}
