import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import QRCode from 'qrcode.react'
import AttendeeLayout from '@/components/AttendeeLayout'
import {
  Trophy, TrendingUp, MapPin, Award, ScanLine,
  BarChart3, Info, Clock, Plus,
} from 'lucide-react'

interface DashboardData {
  totalPoints: number
  currentRank: number
  zonesCompleted: number
  zonesTotal: number
  badges: { id: string; name: string; description?: string; icon?: string }[]
  recentScans: { id: string; zoneName: string; points: number; date: string }[]
}

export default function PassportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      axios
        .get('/api/dashboard')
        .then((res) => {
          if (res.data.success) setDashboard(res.data.data)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <AttendeeLayout>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </AttendeeLayout>
    )
  }

  if (!dashboard) return null

  const stats = [
    { label: 'Total Points', value: dashboard.totalPoints, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Current Rank', value: dashboard.currentRank > 0 ? `#${dashboard.currentRank}` : '#-', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Zones Completed', value: `${dashboard.zonesCompleted}/${dashboard.zonesTotal}`, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Badges', value: dashboard.badges.length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const actions = [
    { title: 'Scan QR Code', desc: 'Scan a zone QR code to participate', icon: ScanLine, link: '/scan' },
    { title: 'View Leaderboard', desc: 'See how you rank against others', icon: BarChart3, link: '/leaderboard?eventId=event-1' },
    { title: 'Event Details', desc: 'Learn more about the event', icon: Info, link: '/event' },
  ]

  return (
    <AttendeeLayout>
      {/* Welcome + QR */}
      <div className="premium-card p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Welcome, {session?.user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-sm text-slate-500 mb-4">{session?.user?.email}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
            <Trophy size={14} />
            {dashboard.totalPoints} points earned
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xs text-slate-500 font-medium">Your Digital Passport</p>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <QRCode value={session?.user?.id || ''} size={88} level="H" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="premium-card p-4 sm:p-5">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={s.color} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.title} href={a.link}>
              <div className="premium-card p-5 cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center mb-3 transition-colors">
                  <Icon size={20} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{a.title}</h3>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      {dashboard.recentScans.length > 0 && (
        <div className="premium-card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {dashboard.recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MapPin size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{scan.zoneName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(scan.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Plus size={14} />
                  {scan.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {dashboard.badges.length > 0 && (
        <div className="premium-card p-5 sm:p-6 mt-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award size={18} className="text-slate-400" />
            Your Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dashboard.badges.map((badge) => (
              <div key={badge.id} className="text-center p-3 rounded-xl bg-slate-50">
                <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
                <p className="text-sm font-semibold text-slate-800">{badge.name}</p>
                {badge.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{badge.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AttendeeLayout>
  )
}
