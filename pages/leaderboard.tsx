import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No event selected</p>
          <button
            onClick={() => router.push('/passport')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">🏅 Leaderboard</h1>
            <p className="text-purple-100">Top Performers</p>
          </div>
          <Link href="/passport">
            <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
              ← Back
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setViewMode('fullscreen')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Fullscreen View
          </button>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No participants yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Rank</th>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-right font-semibold">Points</th>
                  <th className="px-6 py-3 text-right font-semibold">Zones</th>
                  <th className="px-6 py-3 text-right font-semibold">Activities</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`border-t ${
                      entry.rank === 1
                        ? 'bg-yellow-50'
                        : entry.rank === 2
                        ? 'bg-gray-100'
                        : entry.rank === 3
                        ? 'bg-orange-50'
                        : ''
                    } hover:bg-gray-50 transition`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 ? (
                          <span className="text-2xl">🥇</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-2xl">🥈</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="font-bold text-gray-600">{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {entry.userAvatar ? (
                          <img
                            src={entry.userAvatar}
                            alt={entry.userName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                            {entry.userName.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-800">{entry.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-purple-600 text-lg">{entry.points}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">{entry.zonesCompleted}</td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {entry.activitiesCompleted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  page === i + 1
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center">
      <button
        onClick={onExit}
        className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
      >
        Exit
      </button>

      <div className="max-w-4xl w-full px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-8">🏆 LEADERBOARD 🏆</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {entries.slice(0, 3).map((entry) => (
            <div
              key={entry.userId}
              className={`rounded-lg p-6 text-center text-white ${
                entry.rank === 1
                  ? 'bg-yellow-500 scale-105'
                  : entry.rank === 2
                  ? 'bg-gray-400'
                  : 'bg-orange-600'
              }`}
            >
              <div className="text-6xl mb-2">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
              </div>
              <h3 className="text-2xl font-bold mb-2">{entry.userName}</h3>
              <p className="text-4xl font-bold">{entry.points} pts</p>
            </div>
          ))}
        </div>

        {entries.length > 3 && (
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {entries.slice(3).map((entry) => (
                  <tr key={entry.userId} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-lg">{entry.rank}</td>
                    <td className="px-6 py-4 font-semibold">{entry.userName}</td>
                    <td className="px-6 py-4 text-right font-bold text-purple-600 text-lg">
                      {entry.points}
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
