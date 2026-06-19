import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Mock analytics data
  const hourlyData = [
    { hour: '9:00', visits: 45, completions: 38 },
    { hour: '10:00', visits: 52, completions: 44 },
    { hour: '11:00', visits: 48, completions: 41 },
    { hour: '12:00', visits: 61, completions: 52 },
    { hour: '13:00', visits: 55, completions: 47 },
    { hour: '14:00', visits: 67, completions: 58 },
    { hour: '15:00', visits: 72, completions: 63 },
  ]

  const zoneData = [
    { name: 'Hall A', visits: 120, completions: 115 },
    { name: 'Hall B', visits: 98, completions: 92 },
    { name: 'Hall C', visits: 145, completions: 138 },
    { name: 'Networking', visits: 87, completions: 81 },
  ]

  const activityData = [
    { name: 'Quiz', value: 280 },
    { name: 'Poll', value: 250 },
    { name: 'Survey', value: 180 },
    { name: 'Raffle', value: 140 },
  ]

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">📊 Analytics</h1>
          <Link href="/admin">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Back to Admin
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard label="Total Participants" value="245" />
          <MetricCard label="Unique Visitors" value="198" />
          <MetricCard label="Total Scans" value="450" />
          <MetricCard label="Completion Rate" value="87%" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hourly Traffic */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Traffic by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="#3B82F6" />
                <Line type="monotone" dataKey="completions" stroke="#10B981" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Zone Performance */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Zone Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" fill="#3B82F6" />
                <Bar dataKey="completions" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Activity Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Zone Details Table */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Zone Details</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Zone</th>
                  <th className="px-4 py-2 text-right">Visits</th>
                  <th className="px-4 py-2 text-right">Completion</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {zoneData.map((zone) => (
                  <tr key={zone.name} className="border-t">
                    <td className="px-4 py-2">{zone.name}</td>
                    <td className="px-4 py-2 text-right font-semibold">{zone.visits}</td>
                    <td className="px-4 py-2 text-right font-semibold">{zone.completions}</td>
                    <td className="px-4 py-2 text-right text-green-600 font-semibold">
                      {Math.round((zone.completions / zone.visits) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Export Data</h3>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              📥 Export as CSV
            </button>
            <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
              📊 Export as PDF
            </button>
            <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              📈 Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-4xl font-bold text-blue-600">{value}</p>
    </div>
  )
}
