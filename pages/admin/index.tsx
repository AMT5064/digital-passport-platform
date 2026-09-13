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
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user && session.user.role === 'ATTENDEE') {
      router.push('/passport')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  const menuItems = [
    { icon: Calendar, label: 'Events', href: '/admin/events', color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, label: 'Zones', href: '/admin/zones', color: 'from-emerald-500 to-teal-500' },
    { icon: Gamepad2, label: 'Activities', href: '/admin/activities', color: 'from-purple-500 to-pink-500' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', color: 'from-orange-500 to-red-500' },
    { icon: Trophy, label: 'Leaderboard', href: '/admin/leaderboard', color: 'from-yellow-500 to-orange-500' },
    { icon: Users, label: 'Participants', href: '/admin/participants', color: 'from-green-500 to-emerald-500' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', color: 'from-gray-500 to-slate-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
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

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 sm:p-6 lg:p-8">
          {/* Sidebar */}
          <aside
            className={`lg:col-span-1 ${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block lg:sticky lg:top-24 lg:h-fit`}
          >
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white font-medium">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8 animate-slide-in">
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
                value="1"
                trend="+0 this month"
                color="from-blue-500 to-cyan-500"
              />
              <StatBox
                icon={MapPin}
                label="Total Zones"
                value="4"
                trend="Ready to use"
                color="from-emerald-500 to-teal-500"
              />
              <StatBox
                icon={Users}
                label="Participants"
                value="0"
                trend="Waiting to join"
                color="from-purple-500 to-pink-500"
              />
              <StatBox
                icon={Activity}
                label="Total Scans"
                value="0"
                trend="No activity yet"
                color="from-orange-500 to-red-500"
              />
            </div>

            {/* Main Actions Grid */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Manage Your Platform
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.slice(0, 6).map((item) => (
                  <DashboardCard
                    key={item.href}
                    icon={item.icon}
                    title={item.label}
                    description={getDescription(item.label)}
                    href={item.href}
                    color={item.color}
                  />
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Create events and organize your booth experience</li>
                <li>✓ Add zones with unique QR codes for each area</li>
                <li>✓ Configure activities to engage participants</li>
                <li>✓ Monitor real-time analytics and leaderboards</li>
              </ul>
            </div>
          </main>
        </div>
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

function DashboardCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <Link href={href}>
      <a className="group relative overflow-hidden rounded-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 group-hover:border-white/30 rounded-xl transition-all"></div>
        <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-10 transition-opacity rounded-xl`}></div>

        <div className="relative p-6 space-y-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-lg group-hover:text-white transition-colors">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            Open <span className="ml-auto">→</span>
          </div>
        </div>
      </a>
    </Link>
  )
}

function getDescription(label: string): string {
  const descriptions: { [key: string]: string } = {
    Events: 'Create and manage your events',
    Zones: 'Set up QR code zones',
    Activities: 'Design engaging activities',
    Analytics: 'View detailed reports',
    Leaderboard: 'Track rankings',
    Participants: 'Manage participants',
    Settings: 'Configure your account',
  }
  return descriptions[label] || ''
}
