import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user && session.user.role === 'ATTENDEE') {
      router.push('/passport')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-blue-100">Digital Passport Event Management</p>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="max-w-7xl mx-auto flex">
        <aside className="w-64 bg-blue-700 text-white p-6 min-h-screen">
          <nav className="space-y-4">
            <Link href="/admin/events">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                📅 Events
              </button>
            </Link>
            <Link href="/admin/zones">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                📍 Zones
              </button>
            </Link>
            <Link href="/admin/activities">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                🎮 Activities
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                📊 Analytics
              </button>
            </Link>
            <Link href="/admin/leaderboard">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                🏆 Leaderboard
              </button>
            </Link>
            <Link href="/admin/participants">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                👥 Participants
              </button>
            </Link>
            <Link href="/admin/settings">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 rounded transition">
                ⚙️ Settings
              </button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Events"
              description="Manage your events"
              icon="📅"
              link="/admin/events"
            />
            <DashboardCard
              title="Zones"
              description="Create and manage zones"
              icon="📍"
              link="/admin/zones"
            />
            <DashboardCard
              title="Activities"
              description="Configure zone activities"
              icon="🎮"
              link="/admin/activities"
            />
            <DashboardCard
              title="Analytics"
              description="View event analytics"
              icon="📊"
              link="/admin/analytics"
            />
            <DashboardCard
              title="Leaderboard"
              description="View rankings and scores"
              icon="🏆"
              link="/admin/leaderboard"
            />
            <DashboardCard
              title="Participants"
              description="Manage event participants"
              icon="👥"
              link="/admin/participants"
            />
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatBox label="Total Events" value="1" />
            <StatBox label="Total Zones" value="4" />
            <StatBox label="Total Participants" value="0" />
            <StatBox label="Total Scans" value="0" />
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardCard({
  title,
  description,
  icon,
  link,
}: {
  title: string
  description: string
  icon: string
  link: string
}) {
  return (
    <Link href={link}>
      <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-4xl font-bold text-blue-600">{value}</p>
    </div>
  )
}
