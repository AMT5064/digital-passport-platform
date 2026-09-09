import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AdminLayout from '@/components/AdminLayout'
import { Trophy, Crown, Medal } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userAvatar?: string
  points: number
  zonesCompleted: number
  activitiesCompleted: number
}

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/api/leaderboard?eventId=event-1&page=1&pageSize=50')
      .then((res) => {
        if (res.data.success) setEntries(res.data.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const rankStyles = [
    { bg: 'bg-amber-50', text: 'text-amber-700', icon: Crown },
    { bg: 'bg-slate-100', text: 'text-slate-600', icon: Medal },
    { bg: 'bg-orange-50', text: 'text-orange-700', icon: Medal },
  ]

  return (
    <AdminLayout title="Leaderboard" description="Event rankings and scores">
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Trophy size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No participants have earned points yet</p>
        </div>
      ) : (
        <>
          {/* Top 3 */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 0, 2].map((idx) => {
                const entry = entries[idx]
                const style = rankStyles[idx]
                const Icon = style.icon
                return (
                  <div key={entry.userId} className={`premium-card p-4 text-center ${idx === 0 ? 'sm:scale-105' : ''}`}>
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

          {/* Table */}
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
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
          </div>
        </>
      )}
    </AdminLayout>
  )
}
