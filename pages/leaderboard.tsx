import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import AttendeeLayout from '@/components/AttendeeLayout'
import { Trophy, ArrowLeft, Maximize2, Minimize2, Crown, Medal } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userAvatar?: string
  points: number
  zonesCompleted: number
  activitiesCompleted: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { eventId } = router.query
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'normal' | 'fullscreen'>('normal')

  useEffect(() => {
    if (!eventId || typeof eventId !== 'string') return
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/api/leaderboard', {
          params: { eventId, page: 1, pageSize: 50 },
        })
        if (response.data.success) {
          setEntries(response.data.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [eventId])

  if (!eventId) {
    return (
      <AttendeeLayout title="Leaderboard">
        <div className="premium-card p-12 text-center">
          <Trophy size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No event selected</p>
          <Link href="/passport" className="text-indigo-600 hover:text-indigo-500 font-semibold text-sm">
            Back to Dashboard
          </Link>
        </div>
      </AttendeeLayout>
    )
  }

  if (viewMode === 'fullscreen') {
    return <FullscreenLeaderboard entries={entries} onExit={() => setViewMode('normal')} loading={loading} />
  }

  const rankStyles = [
    { bg: 'bg-amber-50', text: 'text-amber-700', icon: Crown },
    { bg: 'bg-slate-100', text: 'text-slate-600', icon: Medal },
    { bg: 'bg-orange-50', text: 'text-orange-700', icon: Medal },
  ]

  return (
    <AttendeeLayout title="Leaderboard">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{entries.length} participants ranked</p>
        <button
          onClick={() => setViewMode('fullscreen')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Maximize2 size={15} /> Fullscreen
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Trophy size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No participants yet</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 0, 2].map((idx) => {
                const entry = entries[idx]
                const style = rankStyles[idx]
                const Icon = style.icon
                return (
                  <div
                    key={entry.userId}
                    className={`premium-card p-4 text-center ${idx === 0 ? 'sm:scale-105 sm:-mt-2' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={24} className={style.text} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{entry.userName}</p>
                    <p className={`text-lg font-bold ${style.text}`}>{entry.points}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full table */}
          <div className="premium-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rank</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Points</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Zones</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Activities</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const style = entry.rank <= 3 ? rankStyles[entry.rank - 1] : null
                  return (
                    <tr key={entry.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5">
                        {style ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${style.bg} text-xs font-bold ${style.text}`}>
                            {entry.rank}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 pl-1">{entry.rank}</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {entry.userAvatar ? (
                            <img src={entry.userAvatar} alt={entry.userName} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                              {entry.userName.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-900">{entry.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <span className="text-sm font-bold text-indigo-600">{entry.points}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right text-sm text-slate-500 hidden sm:table-cell">{entry.zonesCompleted}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-right text-sm text-slate-500 hidden sm:table-cell">{entry.activitiesCompleted}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AttendeeLayout>
  )
}

function FullscreenLeaderboard({
  entries, onExit, loading,
}: {
  entries: LeaderboardEntry[]
  onExit: () => void
  loading: boolean
}) {
  const rankStyles = [
    { bg: 'bg-amber-500', text: 'text-amber-100' },
    { bg: 'bg-slate-400', text: 'text-slate-100' },
    { bg: 'bg-orange-600', text: 'text-orange-100' },
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <button
        onClick={onExit}
        className="absolute top-4 right-4 flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm transition-colors"
      >
        <Minimize2 size={16} /> Exit
      </button>

      <div className="max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8 flex items-center justify-center gap-3">
          <Trophy className="text-amber-400" /> Leaderboard <Trophy className="text-amber-400" />
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-400 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-slate-400">No participants yet</p>
        ) : (
          <>
            {/* Top 3 */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 0, 2].map((idx) => {
                  const entry = entries[idx]
                  const style = rankStyles[idx]
                  return (
                    <div
                      key={entry.userId}
                      className={`rounded-2xl p-5 text-center ${style.bg} ${idx === 0 ? 'scale-105' : ''}`}
                    >
                      <div className="text-4xl mb-2">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">{entry.userName}</h3>
                      <p className="text-2xl font-bold text-white mt-1">{entry.points}</p>
                      <p className="text-xs text-white/70">points</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rest */}
            {entries.length > 3 && (
              <div className="bg-white/10 backdrop-blur rounded-2xl overflow-hidden">
                {entries.slice(3).map((entry) => (
                  <div key={entry.userId} className="flex items-center justify-between px-5 py-3 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 font-bold w-6">{entry.rank}</span>
                      <span className="text-white font-medium text-sm">{entry.userName}</span>
                    </div>
                    <span className="text-indigo-300 font-bold">{entry.points}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
