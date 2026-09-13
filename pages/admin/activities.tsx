import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Gamepad2, Plus, Edit2, Trash2, X, ArrowLeft } from 'lucide-react'

interface Activity {
  id: string
  type: 'QUIZ' | 'POLL' | 'SURVEY' | 'DOWNLOAD' | 'VIDEO' | 'RAFFLE' | 'CUSTOM_CTA'
  zoneId: string
  question?: string
  zone?: { name: string }
}

export default function ActivitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [zones, setZones] = useState<any[]>([])
  const [formData, setFormData] = useState({
    zoneId: '',
    type: 'QUIZ',
    question: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [activitiesRes, zonesRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/zones?eventId=event-1'),
      ])
      const activitiesData = await activitiesRes.json()
      const zonesData = await zonesRes.json()
      setActivities(activitiesData)
      setZones(zonesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? { ...formData, id: editingId }
        : { ...formData, eventId: 'event-1' }

      const response = await fetch('/api/activities', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchData()
        setShowForm(false)
        setEditingId(null)
        setFormData({ zoneId: '', type: 'QUIZ', question: '' })
      }
    } catch (error) {
      console.error('Error saving activity:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity?')) return

    try {
      const response = await fetch('/api/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

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
              <Gamepad2 className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">Activities Management</h1>
                <p className="text-xs text-gray-400">Create engaging zone activities</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              setFormData({ zoneId: '', type: 'QUIZ', question: '' })
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-lg transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Activity
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-xl p-6 mb-8 animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Activity' : 'Create New Activity'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Zone *</label>
                  <select
                    value={formData.zoneId}
                    onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none transition"
                  >
                    <option value="">Select a zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Activity Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none transition"
                  >
                    <option value="QUIZ">Quiz</option>
                    <option value="POLL">Poll</option>
                    <option value="SURVEY">Survey</option>
                    <option value="RAFFLE">Raffle</option>
                    <option value="DOWNLOAD">Download</option>
                    <option value="VIDEO">Video</option>
                    <option value="CUSTOM_CTA">Custom CTA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Question/Title</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                  rows={3}
                  placeholder="Enter activity question or title"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-2 rounded-lg transition-all font-semibold">
                  {editingId ? 'Update Activity' : 'Create Activity'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-all font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activities List */}
        {activities.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
            <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Activities Yet</h3>
            <p className="text-gray-400 mb-6">Create your first activity to engage participants</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-6 py-2 rounded-lg transition-all font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Activity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                      {activity.type}
                    </span>
                    <h3 className="text-lg font-bold">{activity.zone?.name}</h3>
                  </div>
                </div>

                {activity.question && <p className="text-gray-300 text-sm mb-4">{activity.question}</p>}

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setFormData({ zoneId: activity.zoneId, type: activity.type, question: activity.question || '' })
                      setEditingId(activity.id)
                      setShowForm(true)
                    }}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
