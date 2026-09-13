import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Gamepad2, AlertCircle, Plus, X } from 'lucide-react'

// Activity creation page with type-specific forms
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
    title: '',
    description: '',
    options: ['', ''], // For Quiz, Poll, Survey
    correctAnswer: '', // For Quiz
    prize: '', // For Raffle
    winners: 1, // For Raffle
    url: '', // For Video, Download, Custom CTA
    ctaText: '', // For Custom CTA
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

      if (!formData.title) {
        setError('Title is required')
        setLoading(false)
        return
      }

      const payload: any = {
        eventId: campaignId,
        type: formData.type,
        title: formData.title,
        zoneId: formData.zoneId,
      }

      if (['QUIZ', 'POLL', 'SURVEY'].includes(formData.type)) {
        payload.options = formData.options.filter((o) => o.trim())
        if (payload.options.length < 2) {
          setError('Please add at least 2 options')
          setLoading(false)
          return
        }
      }

      if (formData.type === 'QUIZ' && formData.correctAnswer) {
        payload.correctAnswer = formData.correctAnswer
      }

      if (formData.type === 'RAFFLE') {
        payload.prize = formData.prize
        payload.winners = formData.winners
      }

      if (['VIDEO', 'DOWNLOAD', 'CUSTOM_CTA'].includes(formData.type)) {
        payload.url = formData.url
      }

      if (formData.type === 'CUSTOM_CTA') {
        payload.ctaText = formData.ctaText
      }

      if (formData.description) {
        payload.description = formData.description
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const activityTypes = [
    { value: 'QUIZ', label: 'Quiz', description: 'Multiple choice questions' },
    { value: 'POLL', label: 'Poll', description: 'Quick opinion gathering' },
    { value: 'SURVEY', label: 'Survey', description: 'Detailed feedback' },
    { value: 'RAFFLE', label: 'Raffle', description: 'Prize drawing' },
    { value: 'DOWNLOAD', label: 'Download', description: 'Resource distribution' },
    { value: 'VIDEO', label: 'Video', description: 'Video engagement' },
    { value: 'CUSTOM_CTA', label: 'Custom CTA', description: 'Custom call-to-action' },
  ]

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

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
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
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
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
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                placeholder="Enter activity title..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none"
                rows={3}
                placeholder="Optional description..."
              />
            </div>

            {['QUIZ', 'POLL', 'SURVEY'].includes(formData.type) && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Options <span className="text-red-400">*</span></label>
                <div className="space-y-2">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[idx] = e.target.value
                          setFormData({ ...formData, options: newOptions })
                        }}
                        className="flex-1 px-4 py-2 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              options: formData.options.filter((_, i) => i !== idx),
                            })
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-dashed border-white/20 hover:border-white/40 rounded-lg text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {formData.type === 'QUIZ' && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Correct Answer</label>
                <select
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                >
                  <option value="">Select correct answer...</option>
                  {formData.options.map((opt, idx) => (
                    opt.trim() && (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    )
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'RAFFLE' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Prize Description</label>
                  <input
                    type="text"
                    value={formData.prize}
                    onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    placeholder="Describe the prize..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Number of Winners</label>
                  <input
                    type="number"
                    value={formData.winners}
                    onChange={(e) => setFormData({ ...formData, winners: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </>
            )}

            {['VIDEO', 'DOWNLOAD', 'CUSTOM_CTA'].includes(formData.type) && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {formData.type === 'VIDEO' ? 'Video URL' : formData.type === 'DOWNLOAD' ? 'Resource URL' : 'Link URL'}
                  <span className="text-red-400"> *</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  placeholder="https://..."
                />
              </div>
            )}

            {formData.type === 'CUSTOM_CTA' && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Button Text</label>
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  placeholder="e.g., Learn More, Download, Sign Up"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-white text-base shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Activity'}
              </button>
              <Link href={`/admin/campaign/${campaignId}`} className="flex-1">
                <button type="button" className="w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg transition-all font-semibold text-white text-base border border-slate-600 hover:border-slate-500">
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
