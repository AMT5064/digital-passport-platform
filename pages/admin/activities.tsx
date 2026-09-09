import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AdminLayout from '@/components/AdminLayout'
import {
  HelpCircle, BarChart2, FileText, Video, Gift,
  ExternalLink, Download, Gamepad2, Loader2,
} from 'lucide-react'

interface Activity {
  id: string
  type: string
  zoneId: string
  question?: string
}

const activityMeta: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  QUIZ: { label: 'Quiz', icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  POLL: { label: 'Poll', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SURVEY: { label: 'Survey', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  VIDEO: { label: 'Video', icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
  RAFFLE: { label: 'Raffle', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
  CUSTOM_CTA: { label: 'Custom CTA', icon: ExternalLink, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  DOWNLOAD: { label: 'Download', icon: Download, color: 'text-slate-600', bg: 'bg-slate-100' },
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/api/admin/activities?eventId=event-1')
      .then((res) => {
        if (res.data.success) setActivities(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="Activities" description="Configure zone activities">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Gamepad2 size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No activities configured</p>
          <p className="text-sm text-slate-400">Activities are created when you assign them to zones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => {
            const meta = activityMeta[activity.type] || activityMeta.QUIZ
            const Icon = meta.icon
            return (
              <div key={activity.id} className="premium-card p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={meta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-xs font-semibold ${meta.color} mb-1`}>{meta.label}</span>
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                      {activity.question || 'No question set'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
