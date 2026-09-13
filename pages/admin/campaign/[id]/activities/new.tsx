import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Gamepad2 } from 'lucide-react'

export default function CreateActivityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    zoneId: '',
    type: 'QUIZ',
    question: '',
  })

  useEffect(() => {
    if (campaignId) {
      fetchZones()
    }
  }, [campaignId])

  const fetchZones = async () => {
    try {
      const response = await fetch(`/api/zones?eventId=${campaignId}`)
      const data = await response.json()
      setZones(data)
    } catch (err) {
      console.error('Error fetching zones:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.zoneId || !formData.type) {
        setError('Zone and activity type are required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventId: campaignId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create activity')
        setLoading(false)
        return
      }

      router.push(`/admin/campaign/${campaignId}?tab=activities`)
    } catch (err: any) {
      setError(err.message || 'Error creating activity')
      setLoading(false)
    }
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (!campaignId) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/admin/campaign/${campaignId}`}>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Create New Activity</h1>
              <p className="text-xs text-gray-400">Add a new activity to a zone</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Zone *</label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition"
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              {zones.length === 0 && (
                <p className="text-xs text-yellow-400 mt-2">No zones yet. Create a zone first.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Activity Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition"
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

            <div>
              <label className="block text-sm font-medium mb-2">Question/Title</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                rows={4}
                placeholder="Enter the question or title for this activity..."
              />
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 px-6 py-3 rounded-lg transition-all font-semibold"
              >
                {loading ? 'Creating...' : 'Create Activity'}
              </button>
              <Link href={`/admin/campaign/${campaignId}`}>
                <button type="button" className="flex-1 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-semibold">
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
