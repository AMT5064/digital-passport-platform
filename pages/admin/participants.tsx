import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AdminLayout from '@/components/AdminLayout'
import { Users, Mail, Building, Award, ScanLine } from 'lucide-react'

interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  mobile?: string
  company?: string
  designation?: string
  joinedDate: string
  totalScans: number
  totalPoints: number
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/api/admin/participants?eventId=event-1')
      .then((res) => {
        if (res.data.success) setParticipants(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="Participants" description="Manage event attendees">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="premium-card p-4 sm:p-5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
            <Users size={20} className="text-indigo-600" />
          </div>
          {loading ? <div className="skeleton h-7 w-16 rounded" /> : <p className="text-2xl sm:text-3xl font-bold text-slate-900">{participants.length}</p>}
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Total Participants</p>
        </div>
        <div className="premium-card p-4 sm:p-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
            <ScanLine size={20} className="text-emerald-600" />
          </div>
          {loading ? <div className="skeleton h-7 w-16 rounded" /> : <p className="text-2xl sm:text-3xl font-bold text-slate-900">{participants.reduce((s, p) => s + p.totalScans, 0)}</p>}
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Total Scans</p>
        </div>
        <div className="premium-card p-4 sm:p-5 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <Award size={20} className="text-amber-600" />
          </div>
          {loading ? <div className="skeleton h-7 w-16 rounded" /> : <p className="text-2xl sm:text-3xl font-bold text-slate-900">{participants.reduce((s, p) => s + p.totalPoints, 0)}</p>}
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Total Points Awarded</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : participants.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Users size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No participants registered yet</p>
        </div>
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Company</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Scans</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Points</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={11} /> {p.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 hidden md:table-cell">
                      {p.company ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Building size={14} className="text-slate-400" /> {p.company}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right text-sm font-semibold text-slate-700">{p.totalScans}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-right text-sm font-bold text-amber-600">{p.totalPoints}</td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-500 hidden sm:table-cell">
                      {new Date(p.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
