import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Users, Search, ArrowLeft, Trophy, Zap } from 'lucide-react'

interface Participant {
  id: string
  email: string
  firstName: string
  lastName: string
  mobile?: string
  company?: string
  designation?: string
  createdAt: string
  scans: Array<{ id: string; pointsEarned: number; createdAt: string }>
  badges: Array<{ id: string; name: string }>
}

export default function ParticipantsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchParticipants()
    }
  }, [status, router])

  const fetchParticipants = async (searchTerm = '') => {
    try {
      const query = new URLSearchParams({ eventId: 'event-1' })
      if (searchTerm) query.append('search', searchTerm)
      const response = await fetch(`/api/participants?${query}`)
      const data = await response.json()
      setParticipants(data)
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    fetchParticipants(value)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const totalPoints = participants.reduce((sum, p) => sum + p.scans.reduce((s, scan) => s + scan.pointsEarned, 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">Participants Management</h1>
                <p className="text-xs text-gray-400">View and manage event attendees</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pl-12 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Participants</p>
                <p className="text-3xl font-bold mt-2">{participants.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Points Earned</p>
                <p className="text-3xl font-bold mt-2">{totalPoints}</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Points</p>
                <p className="text-3xl font-bold mt-2">{participants.length > 0 ? Math.round(totalPoints / participants.length) : 0}</p>
              </div>
              <Trophy className="w-10 h-10 text-amber-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Participants Table */}
        {participants.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Participants Yet</h3>
            <p className="text-gray-400">Participants will appear here when they join your event</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 backdrop-blur">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Company</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Scans</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Points</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {participants.map((participant) => {
                  const points = participant.scans.reduce((sum, scan) => sum + scan.pointsEarned, 0)
                  return (
                    <tr key={participant.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold">
                        {participant.firstName} {participant.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{participant.email}</td>
                      <td className="px-6 py-4 text-sm">{participant.company || '-'}</td>
                      <td className="px-6 py-4 text-sm">{participant.scans.length}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-yellow-400">{points} pts</td>
                      <td className="px-6 py-4 text-sm">{participant.badges.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
