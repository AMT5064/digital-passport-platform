import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import { ArrowLeft, Maximize2, Trophy, Flame, Target, Zap, Gamepad2 } from 'lucide-react'

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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [viewMode, setViewMode] = useState<'normal' | 'fullscreen'>('normal')

  useEffect(() => {
    if (!eventId || typeof eventId !== 'string') return

    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/api/leaderboard', {
          params: { eventId, page, pageSize: 50 },
        })

        if (response.data.success) {
          setEntries(response.data.data.data)
          setTotalPages(response.data.data.totalPages)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [eventId, page])

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-300 mb-6">No event selected</p>
          <button
            onClick={() => router.push('/passport')}
            className="btn btn-primary bg-gradient-to-r from-purple-600 to-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (viewMode === 'fullscreen') {
    return <FullscreenLeaderboard entries={entries} onExit={() => setViewMode('normal')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Fixed Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/passport" className="p-2 hover:bg-white/10 rounded-lg transition-colors inline-flex">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="w-8 h-8" />
                Leaderboard
              </h1>
              <p className="text-sm text-gray-400">Top performers in this event</p>
            </div>
          </div>

          <button
            onClick={() => setViewMode('fullscreen')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Maximize2 className="w-5 h-5" />
            Fullscreen
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top 3 Podium */}
        {!loading && entries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[entries[1], entries[0], entries[2]].map(
              (entry, idx) =>
                entry && (
                  <PodiumCard
                    key={entry.userId}
                    entry={entry}
                    position={idx === 1 ? 'gold' : idx === 0 ? 'silver' : 'bronze'}
                  />
                )
            )}
          </div>
        )}

        {/* Main Leaderboard */}
        {loading ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Loading rankings...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur border border-white/10 rounded-xl animate-fade-in">
            <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300">No participants yet. The action begins soon!</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-2xl overflow-hidden animate-scale-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">RANK</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">PARTICIPANT</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">POINTS</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">ZONES</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">ACTIVITIES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.userId}
                      className="hover:bg-white/10 transition-colors group"
                      style={{
                        animation: `slideIn 0.5s ease-out ${idx * 0.05}s both`,
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.rank <= 3 ? (
                            <span className="text-2xl">
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="w-8 h-8 flex items-center justify-center font-bold text-purple-400 bg-white/5 rounded-lg">
                              {entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-sm font-bold text-slate-900 flex-shrink-0">
                            {entry.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium group-hover:text-purple-300 transition-colors">
                            {entry.userName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="font-bold text-lg">{entry.points}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Target className="w-4 h-4 text-emerald-400" />
                          <span>{entry.zonesCompleted}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-blue-400" />
                          <span>{entry.activitiesCompleted}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = page > 3 ? page - 2 + i : i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    page === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                      : 'border border-white/20 hover:bg-white/10'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PodiumCard({
  entry,
  position,
}: {
  entry: LeaderboardEntry
  position: 'gold' | 'silver' | 'bronze'
}) {
  const colors = {
    gold: { bg: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-500/50', height: 'h-80' },
    silver: { bg: 'from-gray-300 to-slate-400', glow: 'shadow-gray-400/50', height: 'h-96' },
    bronze: { bg: 'from-orange-400 to-red-500', glow: 'shadow-orange-500/50', height: 'h-72' },
  }

  const medals = {
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
  }

  return (
    <div className={`relative ${colors[position].height} animate-slide-in`}>
      <div
        className={`absolute inset-0 bg-gradient-to-b ${colors[position].bg} rounded-2xl shadow-2xl ${colors[position].glow} opacity-80`}
      ></div>
      <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-6">
        <div className="text-5xl mb-4">{medals[position]}</div>
        <h3 className="text-2xl font-bold mb-2">{entry.userName}</h3>
        <p className="text-xl font-semibold mb-4">{entry.points} Points</p>
        <div className="grid grid-cols-2 gap-4 text-sm w-full mt-auto">
          <div>
            <p className="text-white/80">Zones</p>
            <p className="text-lg font-bold">{entry.zonesCompleted}</p>
          </div>
          <div>
            <p className="text-white/80">Activities</p>
            <p className="text-lg font-bold">{entry.activitiesCompleted}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FullscreenLeaderboard({
  entries,
  onExit,
}: {
  entries: LeaderboardEntry[]
  onExit: () => void
}) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col overflow-hidden">
      {/* Fixed Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-purple-500/20 to-transparent"></div>
        </div>
      </div>

      <button
        onClick={onExit}
        className="absolute top-6 right-6 z-20 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg"
      >
        <ArrowLeft className="w-6 h-6 rotate-90" />
      </button>

      <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        {/* Title */}
        <h1 className="text-7xl font-bold mb-4 text-center animate-slide-in">
          🏆 LEADERBOARD 🏆
        </h1>
        <p className="text-2xl text-gray-300 mb-12 text-center">Top Performers</p>

        {/* Top 3 */}
        <div className="grid grid-cols-3 gap-8 mb-16 w-full max-w-4xl">
          {[entries[1], entries[0], entries[2]].map(
            (entry, idx) =>
              entry && (
                <div
                  key={entry.userId}
                  className={`text-center transform transition-all ${
                    idx === 1 ? 'scale-110' : 'scale-90'
                  } animate-scale-in`}
                >
                  <div className={`text-8xl mb-4 ${idx === 1 ? 'animate-pulse' : ''}`}>
                    {idx === 1 ? '🥇' : idx === 0 ? '🥈' : '🥉'}
                  </div>
                  <h3 className="text-3xl font-bold mb-2">{entry.userName}</h3>
                  <p className="text-5xl font-bold text-yellow-400">{entry.points}</p>
                  <p className="text-lg text-gray-400 mt-2">points</p>
                </div>
              )
          )}
        </div>

        {/* Rest of Rankings */}
        {entries.length > 3 && (
          <div className="w-full max-w-4xl bg-white/10 backdrop-blur border border-white/20 rounded-2xl overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-white/10">
                {entries.slice(3).map((entry, idx) => (
                  <tr
                    key={entry.userId}
                    className="hover:bg-white/10 transition-colors"
                    style={{
                      animation: `slideIn 0.5s ease-out ${idx * 0.05}s both`,
                    }}
                  >
                    <td className="px-8 py-4 text-xl font-bold text-purple-400">#{entry.rank}</td>
                    <td className="px-8 py-4 text-xl font-semibold">{entry.userName}</td>
                    <td className="px-8 py-4 text-right text-2xl font-bold text-yellow-400">
                      {entry.points} pts
                    </td>
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
