import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AdminLayout from '@/components/AdminLayout'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Users, ScanLine, UserCheck, CheckCircle2, Download, FileText, FileSpreadsheet } from 'lucide-react'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/api/analytics?eventId=event-1')
      .then((res) => {
        if (res.data.success) setData(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']

  const metrics = [
    { label: 'Participants', value: data?.totalParticipants ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Unique Visitors', value: data?.uniqueVisitors ?? 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Scans', value: data?.totalScans ?? 0, icon: ScanLine, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completion Rate', value: data?.totalScans ? `${Math.round((data.uniqueVisitors / data.totalScans) * 100)}%` : '0%', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const hourlyData = (data?.hourlyTraffic || []).map((h: any) => ({
    hour: h.hour,
    visits: h.visits,
    completions: h.completions,
  }))

  const zoneData = (data?.zoneStats || []).map((z: any) => ({
    name: z.zoneName,
    visits: z.visits,
    completions: z.completionRate,
  }))

  const activityData = (data?.topActivities || []).map((a: any) => ({
    name: a.activityType?.replace(/_/g, ' ') || a.zoneName,
    value: a.completions,
  }))

  return (
    <AdminLayout title="Analytics" description="Event performance insights">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="premium-card p-4 sm:p-5">
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={m.color} />
              </div>
              {loading ? (
                <div className="skeleton h-7 w-16 rounded" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{m.value}</p>
              )}
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{m.label}</p>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Hourly Traffic */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Traffic by Hour</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="visits" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completions" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Zone Performance */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Zone Performance</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="visits" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          {activityData.length > 0 && (
            <div className="premium-card p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Activity Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={activityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                    {activityData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Zone Details Table */}
          <div className="premium-card p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Zone Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500">Zone</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-slate-500">Visits</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-slate-500">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.zoneStats || []).map((zone: any) => (
                    <tr key={zone.zoneId} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-2.5 text-slate-700">{zone.zoneName}</td>
                      <td className="px-2 py-2.5 text-right font-semibold text-slate-700">{zone.visits}</td>
                      <td className="px-2 py-2.5 text-right font-semibold text-emerald-600">{Math.round(zone.completionRate)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="premium-card p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Export Data</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Download size={16} /> CSV
          </button>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <FileText size={16} /> PDF
          </button>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
