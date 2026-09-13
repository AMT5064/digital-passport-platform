import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Trophy, ArrowLeft, Medal } from 'lucide-react'

export default function AdminLeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchLeaderboard()
    }
  }, [status, router])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/dashboard-stats')
      const data = await response.json()
      setLeaderboard(data.topLeaderboard || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] via-[#16123D] to-[#201751] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-amber-500'
      case 2:
        return 'from-slate-400 to-slate-500'
      case 3:
        return 'from-orange-600 to-amber-600'
      default:
        return 'from-blue-500 to-cyan-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] via-[#16123D] to-[#201751] text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#201751]/50 to-[#16123D]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold">Leaderboard Management</h1>
                <p className="text-xs text-gray-400">Top participants rankings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {leaderboard.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Rankings Yet</h3>
            <p className="text-gray-400">Leaderboard will populate as participants earn points</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className="bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getMedalColor(index + 1)} rounded-lg flex items-center justify-center font-bold text-lg`}>
                      {index < 3 ? <Medal className="w-6 h-6" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Rank #{entry.rank}</p>
                      <p className="text-gray-400 text-sm">{entry.zonesCompleted} zones completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-400">{entry.points}</p>
                    <p className="text-gray-400 text-sm">points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Total Participants Ranked</p>
            <p className="text-3xl font-bold">{leaderboard.length}</p>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Top Score</p>
            <p className="text-3xl font-bold text-yellow-400">{leaderboard[0]?.points || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Average Score</p>
            <p className="text-3xl font-bold">
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, e) => sum + e.points, 0) / leaderboard.length) : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
