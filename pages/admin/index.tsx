import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Gamepad2,
  BarChart3,
  Trophy,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Activity,
  Eye,
  Plus,
  ArrowRight,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  venue?: string
  status: string
  _count?: {
    zones: number
    attendees: number
    scans: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalZones: 0,
    totalParticipants: 0,
    totalScans: 0,
    todaysScans: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user && session.user.role === 'ATTENDEE') {
      router.push('/passport')
    } else {
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        fetch('/api/dashboard-stats'),
        fetch('/api/events'),
      ])
      const statsData = await statsRes.json()
      const campaignsData = await campaignsRes.json()
      setStats(statsData)
      setCampaigns(campaignsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#201751]/50 to-[#16123D]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00CBB3] to-[#00CBB3] rounded-lg flex items-center justify-center font-bold text-[#16123D]">
                DP
              </div>
              <div>
                <h1 className="text-xl font-bold">Command Center</h1>
                <p className="text-xs text-gray-400">Event Management Platform</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{session.user.name}</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
            <button
              onClick={() => signOut({ redirect: false }).then(() => router.push('/login'))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Main Content */}
        <main className="space-y-6 animate-slide-in">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-[#16123D]/60 to-[#7600FF]/10 backdrop-blur border border-white/10 rounded-2xl px-6 py-5">
              <h2 className="text-2xl font-oswald font-bold mb-1">Welcome back, {session.user.name}!</h2>
              <p className="text-gray-300 text-sm">Here&apos;s what&apos;s happening with your events today</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox icon={Calendar} label="Active Events" value={stats.totalEvents} color="#00CBB3" />
              <StatBox icon={MapPin} label="Total Zones" value={stats.totalZones} color="#7600FF" />
              <StatBox icon={Users} label="Participants" value={stats.totalParticipants} color="#FFB800" />
              <StatBox icon={Activity} label="Total Scans" value={stats.totalScans} color="#F96A32" />
            </div>

            {/* Campaigns Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-oswald font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Your Campaigns
                </h3>
                <Link href="/admin/events">
                  <button className="flex items-center gap-2 bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-4 py-2 rounded-lg transition-colors font-semibold text-sm">
                    <Plus className="w-4 h-4" />
                    New Campaign
                  </button>
                </Link>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-gradient-to-br from-[#16123D]/40 to-[#7600FF]/10 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                  <h4 className="text-xl font-oswald font-bold mb-2">No Campaigns Yet</h4>
                  <p className="text-gray-400 mb-6">Create your first campaign to get started</p>
                  <Link href="/admin/events">
                    <button className="bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-6 py-3 rounded-lg transition-colors font-semibold inline-flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create First Campaign
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {campaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/admin/campaign/${campaign.id}`}
                      className="group block bg-gradient-to-br from-[#16123D]/80 to-[#201751]/60 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-[#00CBB3]/40 hover:from-[#16123D] hover:to-[#201751]/80 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#00CBB3]/15 border border-[#00CBB3]/30 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-[#00CBB3]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold group-hover:text-[#00CBB3] transition-colors truncate">{campaign.name}</h4>
                            {campaign.venue && <p className="text-xs text-gray-400 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" /> {campaign.venue}</p>}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide flex-shrink-0 ${
                          campaign.status === 'LIVE' ? 'bg-[#00CBB3]/20 text-[#00CBB3]' :
                          campaign.status === 'PUBLISHED' ? 'bg-[#7600FF]/20 text-[#B266FF]' :
                          'bg-[#FFB800]/20 text-[#FFB800]'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>

                      {campaign.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{campaign.description}</p>}

                      <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{campaign._count?.zones || 0}</span>
                          <span className="text-xs text-gray-500">Zones</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{campaign._count?.attendees || 0}</span>
                          <span className="text-xs text-gray-500">Participants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{campaign._count?.scans || 0}</span>
                          <span className="text-xs text-gray-500">Scans</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00CBB3] group-hover:translate-x-0.5 transition-all ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </main>
      </div>
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: `${color}25` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-gray-400 text-xs truncate">{label}</p>
      </div>
    </div>
  )
}

