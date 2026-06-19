import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import QRCode from 'qrcode.react'

interface DashboardData {
  user: any
  totalPoints: number
  currentRank: number
  zonesCompleted: number
  zonesTotal: number
  badges: any[]
  recentScans: any[]
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
      // In a real implementation, this would fetch dashboard data
      // For now, we'll show a mock dashboard
      setDashboard({
        user: session.user,
        totalPoints: 0,
        currentRank: 0,
        zonesCompleted: 0,
        zonesTotal: 4,
        badges: [],
        recentScans: [],
      })
      setLoading(false)
    }
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Digital Passport</h1>
            <p className="text-blue-100">Event Engagement Platform</p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome, {dashboard.user.name}!
              </h2>
              <p className="text-gray-600">
                {dashboard.user.email}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Your Digital Passport</p>
              <QRCode value={dashboard.user.id} size={100} level="H" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Points" value={dashboard.totalPoints} icon="🏆" />
          <StatCard title="Current Rank" value={`#${dashboard.currentRank || '-'}`} icon="📈" />
          <StatCard
            title="Zones Completed"
            value={`${dashboard.zonesCompleted}/${dashboard.zonesTotal}`}
            icon="📍"
          />
          <StatCard title="Badges" value={dashboard.badges.length} icon="🎖️" />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="Scan QR Code"
            description="Scan a zone QR code to participate"
            icon="📱"
            action={() => router.push('/scan')}
          />
          <ActionCard
            title="View Leaderboard"
            description="See how you rank against others"
            icon="🏅"
            action={() => router.push('/leaderboard')}
          />
          <ActionCard
            title="Event Details"
            description="Learn more about the event"
            icon="ℹ️"
            action={() => router.push('/event')}
          />
        </div>

        {/* Badges Section */}
        {dashboard.badges.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboard.badges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                  <p className="font-semibold text-sm text-gray-800">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: any; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function ActionCard({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description: string
  icon: string
  action: () => void
}) {
  return (
    <button
      onClick={action}
      className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition cursor-pointer"
    >
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </button>
  )
}
