import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, TrendingUp, Users, Zap, Target } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchAnalytics()
    }
  }, [status, router])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/dashboard-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Mock hourly data for charts
  const hourlyData = [
    { hour: '9:00', scans: 12, completions: 10 },
    { hour: '10:00', scans: 19, completions: 15 },
    { hour: '11:00', scans: 15, completions: 12 },
    { hour: '12:00', scans: 25, completions: 22 },
    { hour: '13:00', scans: 22, completions: 18 },
    { hour: '14:00', scans: 29, completions: 25 },
    { hour: '15:00', scans: 31, completions: 28 },
  ]

  const activityData = [
    { name: 'Scans', value: stats?.totalScans || 0, color: '#3B82F6' },
    { name: 'Participants', value: stats?.totalParticipants || 0, color: '#10B981' },
    { name: 'Zones', value: stats?.totalZones || 0, color: '#F59E0B' },
  ]

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
              <TrendingUp className="w-8 h-8 text-orange-400" />
              <div>
                <h1 className="text-2xl font-bold">Analytics & Reports</h1>
                <p className="text-xs text-gray-400">Event engagement metrics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Zap}
            label="Total Scans"
            value={stats?.totalScans || 0}
            trend={`${stats?.todaysScans || 0} today`}
            color="from-orange-500 to-red-500"
          />
          <MetricCard
            icon={Users}
            label="Total Participants"
            value={stats?.totalParticipants || 0}
            trend="Active attendees"
            color="from-purple-500 to-pink-500"
          />
          <MetricCard
            icon={Target}
            label="Total Zones"
            value={stats?.totalZones || 0}
            trend="Active locations"
            color="from-emerald-500 to-teal-500"
          />
          <MetricCard
            icon={TrendingUp}
            label="Engagement Rate"
            value={stats?.totalParticipants > 0 ? Math.round((stats?.totalScans / (stats?.totalParticipants * stats?.totalZones)) * 100) || 0 : 0}
            trend="%"
            color="from-blue-500 to-cyan-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hourly Scans Chart */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Hourly Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                <Line type="monotone" dataKey="completions" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Activity Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={activityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatSummary
              label="Average Scans per Participant"
              value={stats?.totalParticipants > 0 ? (stats?.totalScans / stats?.totalParticipants).toFixed(1) : '0'}
              change="+12% from last event"
            />
            <StatSummary
              label="Zones Coverage"
              value={`${stats?.totalZones || 0}`}
              change="All zones active"
            />
            <StatSummary
              label="Peak Hour"
              value="3:00 PM"
              change="15 scans/hour"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all group">
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{trend}</p>
    </div>
  )
}

function StatSummary({ label, value, change }: any) {
  return (
    <div className="bg-white/5 rounded-lg p-4">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-green-400 mt-2">{change}</p>
    </div>
  )
}
