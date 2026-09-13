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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-secondary-purple to-secondary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-purple to-secondary text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold">
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
        <main className="space-y-8 animate-slide-in">
            {/* Welcome Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {session.user.name}!</h2>
                <p className="text-gray-300">Here&apos;s what&apos;s happening with your events today</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatBox
                icon={Calendar}
                label="Active Events"
                value={stats.totalEvents}
                trend={`${stats.totalEvents} total`}
                color="from-blue-500 to-cyan-500"
              />
              <StatBox
                icon={MapPin}
                label="Total Zones"
                value={stats.totalZones}
                trend={`${stats.totalZones} zones`}
                color="from-emerald-500 to-teal-500"
              />
              <StatBox
                icon={Users}
                label="Participants"
                value={stats.totalParticipants}
                trend={`${stats.totalParticipants} attendees`}
                color="from-purple-500 to-pink-500"
              />
              <StatBox
                icon={Activity}
                label="Total Scans"
                value={stats.totalScans}
                trend={`${stats.todaysScans} today`}
                color="from-orange-500 to-red-500"
              />
            </div>

            {/* Campaigns Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Your Campaigns
                </h3>
                <Link href="/admin/events">
                  <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-lg transition-all font-semibold text-sm">
                    <Plus className="w-4 h-4" />
                    New Campaign
                  </button>
                </Link>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                  <h4 className="text-xl font-bold mb-2">No Campaigns Yet</h4>
                  <p className="text-gray-400 mb-6">Create your first campaign to get started</p>
                  <Link href="/admin/events">
                    <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-6 py-3 rounded-lg transition-all font-semibold inline-flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create First Campaign
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => (
                    <Link key={campaign.id} href={`/admin/campaign/${campaign.id}`}>
                      <a className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold group-hover:text-cyan-400 transition-colors mb-2">{campaign.name}</h4>
                            {campaign.venue && <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {campaign.venue}</p>}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            campaign.status === 'LIVE' ? 'bg-green-500/20 text-green-300' :
                            campaign.status === 'PUBLISHED' ? 'bg-primary/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>

                        {campaign.description && <p className="text-sm text-gray-300 mb-4 line-clamp-2">{campaign.description}</p>}

                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{campaign._count?.zones || 0}</p>
                            <p className="text-xs text-gray-400">Zones</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{campaign._count?.attendees || 0}</p>
                            <p className="text-xs text-gray-400">Participants</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{campaign._count?.scans || 0}</p>
                            <p className="text-xs text-gray-400">Scans</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Click to manage</span>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </a>
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
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend: string
  color: string
}) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all group">
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-xs text-gray-500">{trend}</p>
    </div>
  )
}

