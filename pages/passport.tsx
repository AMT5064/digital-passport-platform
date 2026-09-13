import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import { Trophy, TrendingUp, MapPin, Award, QrCode, BarChart3, Info, LogOut } from 'lucide-react'

interface DashboardData {
  user: any
  totalPoints: number
  currentRank: number | null
  zonesCompleted: number
  zonesTotal: number
  badges: any[]
}

export default function PassportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role && (session.user.role === 'SUPER_ADMIN' || session.user.role === 'EVENT_ADMIN')) {
      router.push('/admin')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      axios
        .get('/api/passport-stats')
        .then((res) => {
          setDashboard({
            user: res.data.user,
            totalPoints: res.data.totalPoints,
            currentRank: res.data.currentRank,
            zonesCompleted: res.data.zonesCompleted,
            zonesTotal: res.data.zonesTotal,
            badges: res.data.badges,
          })
        })
        .catch((err) => console.error('Failed to load passport stats:', err))
        .finally(() => setLoading(false))
    }
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-oswald font-bold">Digital Passport</h1>
            <p className="text-xs text-gray-400">Event Engagement Platform</p>
          </div>
          <button
            onClick={() => signOut({ redirect: false }).then(() => router.push('/login'))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-[#16123D]/60 to-[#7600FF]/10 backdrop-blur border border-white/10 rounded-2xl p-5">
          <h2 className="text-xl font-oswald font-bold mb-1 truncate">Welcome, {dashboard.user.name}!</h2>
          <p className="text-gray-400 text-sm truncate">{dashboard.user.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Trophy} label="Total Points" value={dashboard.totalPoints} color="#FFB800" />
          <StatCard icon={TrendingUp} label="Current Rank" value={dashboard.currentRank ? `#${dashboard.currentRank}` : '-'} color="#00CBB3" />
          <StatCard icon={MapPin} label="Zones Completed" value={`${dashboard.zonesCompleted}/${dashboard.zonesTotal}`} color="#7600FF" />
          <StatCard icon={Award} label="Badges" value={dashboard.badges.length} color="#F96A32" />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <ActionCard
            icon={QrCode}
            title="Scan QR Code"
            description="Scan a zone's QR code to participate"
            color="#00CBB3"
            onClick={() => router.push('/scan')}
          />
          <ActionCard
            icon={BarChart3}
            title="View Leaderboard"
            description="See how you rank against others"
            color="#7600FF"
            onClick={() => router.push('/leaderboard')}
          />
          <ActionCard
            icon={Info}
            title="Event Details"
            description="Learn more about the event"
            color="#FFB800"
            onClick={() => router.push('/event')}
          />
        </div>

        {/* Badges Section */}
        {dashboard.badges.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-base font-oswald font-bold mb-4">Your Badges</h3>
            <div className="grid grid-cols-4 gap-3">
              {dashboard.badges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <div className="text-3xl mb-1">{badge.icon || '🏆'}</div>
                  <p className="text-xs text-gray-300 truncate">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}25` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 text-left transition-all"
    >
      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold truncate">{title}</h3>
        <p className="text-gray-400 text-sm truncate">{description}</p>
      </div>
    </button>
  )
}
