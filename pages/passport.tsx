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
  event: { id: string; name: string; bannerImage: string | null; themeColor: string } | null
  zones: { id: string; name: string; points: number; activityType: string | null; completed: boolean; pointsEarned: number | null }[]
  players: number
  nextTarget: { rank: number; name: string; pointsNeeded: number; tied: boolean } | null
  tiedForLead: boolean
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
            event: res.data.event,
            zones: res.data.zones || [],
            players: res.data.players || 0,
            nextTarget: res.data.nextTarget,
            tiedForLead: !!res.data.tiedForLead,
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

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center px-4 text-white text-center">
        <div>
          <p className="mb-4">We couldn&apos;t load your passport right now.</p>
          <button onClick={() => window.location.reload()} className="bg-[#00CBB3] text-[#16123D] px-6 py-2.5 rounded-lg font-semibold">Try again</button>
        </div>
      </div>
    )
  }

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
        <div className="bg-gradient-to-br from-[#16123D]/60 to-[#7600FF]/10 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
          {dashboard.event?.bannerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dashboard.event.bannerImage} alt={dashboard.event.name} className="w-full aspect-[8/3] object-cover" />
          )}
          <div className="p-5">
            <h2 className="text-xl font-oswald font-bold mb-1 truncate">Welcome, {dashboard.user.name}!</h2>
            <p className="text-gray-400 text-sm truncate">{dashboard.user.email}</p>
            {dashboard.event && (
              <p className="text-xs mt-2 truncate font-semibold" style={{ color: dashboard.event.themeColor || '#00CBB3' }}>
                {dashboard.event.name}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Trophy} label="Total Points" value={dashboard.totalPoints} color="#FFB800" />
          <StatCard
            icon={TrendingUp}
            label={dashboard.currentRank ? `Rank of ${dashboard.players}` : 'Current Rank'}
            value={dashboard.currentRank ? `#${dashboard.currentRank}` : '-'}
            color="#00CBB3"
          />
          <StatCard icon={MapPin} label="Booths Completed" value={`${dashboard.zonesCompleted}/${dashboard.zonesTotal}`} color="#7600FF" />
          <StatCard icon={Award} label="Badges" value={dashboard.badges.length} color="#F96A32" />
        </div>

        <Journey dashboard={dashboard} />

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
            onClick={() => router.push(dashboard.event ? `/leaderboard?eventId=${dashboard.event.id}` : '/leaderboard')}
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

// What the attendee has done, what's left, and how close they are to moving up
function Journey({ dashboard }: { dashboard: DashboardData }) {
  const color = dashboard.event?.themeColor || '#00CBB3'
  if (!dashboard.event) {
    return (
      <div className="rounded-2xl p-5 border border-[#00CBB3]/40 bg-[#00CBB3]/10">
        <p className="font-oswald font-bold text-lg">Start your passport</p>
        <p className="text-sm text-gray-300 mt-1">Scan the QR code at any booth to join the event and earn your first points.</p>
      </div>
    )
  }

  const left = dashboard.zones.filter((z) => !z.completed)
  const pointsLeft = left.reduce((sum, z) => sum + z.points, 0)
  const progress = dashboard.zonesTotal ? Math.round((dashboard.zonesCompleted / dashboard.zonesTotal) * 100) : 0
  const tip =
    dashboard.zonesCompleted === 0
      ? 'Scan the QR code at any booth to get on the leaderboard.'
      : left.length === 0
        ? 'You completed every booth. Check the leaderboard to see where you finished!'
        : dashboard.currentRank === 1 && dashboard.tiedForLead
          ? `You're tied for the lead and got there first!${left.length ? ` ${left.length} more booth${left.length > 1 ? 's' : ''} would put you clear.` : ''}`
        : dashboard.currentRank === 1
          ? `You're leading! ${left.length} more booth${left.length > 1 ? 's' : ''} could add ${pointsLeft} pts to stay ahead.`
          : dashboard.nextTarget?.tied
            ? `You're tied with ${dashboard.nextTarget.name} on ${dashboard.totalPoints} pts, but they got there first. ${left.length ? 'One more booth puts you ahead!' : ''}`
          : dashboard.nextTarget && dashboard.nextTarget.pointsNeeded <= pointsLeft
            ? `${dashboard.nextTarget.pointsNeeded} pts to pass ${dashboard.nextTarget.name} and reach #${dashboard.nextTarget.rank}. Up to ${pointsLeft} pts still to collect.`
            : `Up to ${pointsLeft} pts still to collect at ${left.length} booth${left.length > 1 ? 's' : ''}. Every booth counts!`

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-oswald font-bold text-lg">Your journey</h3>
          <span className="text-sm font-semibold" style={{ color }}>{progress}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>
        <p className="text-sm text-gray-300 mt-3">💡 {tip}</p>
      </div>
      <ul className="space-y-2">
        {[...left, ...dashboard.zones.filter((z) => z.completed)].map((z) => (
          <li key={z.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${z.completed ? 'border-white/5 bg-white/[0.02]' : 'border-white/10 bg-white/5'}`}>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${z.completed ? 'text-[#16123D]' : 'border border-white/30 text-transparent'}`}
              style={z.completed ? { backgroundColor: color } : undefined}
            >
              ✓
            </span>
            <span className={`flex-1 min-w-0 text-sm truncate ${z.completed ? 'text-gray-400' : 'text-white'}`}>{z.name}</span>
            <span className={`text-xs font-semibold whitespace-nowrap ${z.completed ? 'text-gray-400' : 'text-[#FFB800]'}`}>
              {z.completed ? `+${z.pointsEarned ?? 0}` : `${z.points} pts`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
