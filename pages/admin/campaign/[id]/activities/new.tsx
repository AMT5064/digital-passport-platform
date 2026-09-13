import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Gamepad2, AlertCircle } from 'lucide-react'

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
              <p className="text-sm text-gray-400">Add a new activity to a zone</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Zone <span className="text-red-400">*</span></label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all appearance-none cursor-pointer hover:border-white/30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="" className="bg-slate-900 text-white">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id} className="bg-slate-900 text-white">
                    {zone.name}
                  </option>
                ))}
              </select>
              {zones.length === 0 && (
                <p className="text-sm text-yellow-400 mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No zones yet. Create a zone first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Activity Type <span className="text-red-400">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all appearance-none cursor-pointer hover:border-white/30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="QUIZ" className="bg-slate-900 text-white">Quiz</option>
                <option value="POLL" className="bg-slate-900 text-white">Poll</option>
                <option value="SURVEY" className="bg-slate-900 text-white">Survey</option>
                <option value="RAFFLE" className="bg-slate-900 text-white">Raffle</option>
                <option value="DOWNLOAD" className="bg-slate-900 text-white">Download</option>
                <option value="VIDEO" className="bg-slate-900 text-white">Video</option>
                <option value="CUSTOM_CTA" className="bg-slate-900 text-white">Custom CTA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Question/Title</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none"
                rows={4}
                placeholder="Enter the question or title for this activity..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-white text-base"
              >
                {loading ? 'Creating...' : 'Create Activity'}
              </button>
              <Link href={`/admin/campaign/${campaignId}`} className="flex-1">
                <button type="button" className="w-full bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-semibold text-white text-base">
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
