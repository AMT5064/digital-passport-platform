import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import {
  Calendar, MapPin, Gamepad2, BarChart3, Trophy, Users,
  TrendingUp, ScanLine, UserCheck, Activity,
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalScans: 0,
    uniqueVisitors: 0,
    totalZones: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/api/analytics?eventId=event-1')
      .then((res) => {
        if (res.data.success) {
          setStats({
            totalParticipants: res.data.data.totalParticipants,
            totalScans: res.data.data.totalScans,
            uniqueVisitors: res.data.data.uniqueVisitors,
            totalZones: res.data.data.zoneStats?.length || 0,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Participants', value: stats.totalParticipants, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Scans', value: stats.totalScans, icon: ScanLine, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unique Visitors', value: stats.uniqueVisitors, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Zones', value: stats.totalZones, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const modules = [
    { title: 'Events', desc: 'Manage your events', icon: Calendar, link: '/admin/events' },
    { title: 'Zones', desc: 'Create and manage zones', icon: MapPin, link: '/admin/zones' },
    { title: 'Activities', desc: 'Configure zone activities', icon: Gamepad2, link: '/admin/activities' },
    { title: 'Analytics', desc: 'View event analytics', icon: BarChart3, link: '/admin/analytics' },
    { title: 'Leaderboard', desc: 'View rankings and scores', icon: Trophy, link: '/admin/leaderboard' },
    { title: 'Participants', desc: 'Manage event participants', icon: Users, link: '/admin/participants' },
  ]

  return (
    <AdminLayout title="Dashboard" description="Overview of your event engagement platform">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="premium-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
                <TrendingUp size={16} className="text-slate-300" />
              </div>
              {loading ? (
                <div className="skeleton h-7 w-16 rounded" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{s.value}</p>
              )}
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Modules */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <Link key={m.title} href={m.link}>
              <div className="premium-card p-5 cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0">
                    <Icon size={20} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{m.title}</h3>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </AdminLayout>
  )
}
