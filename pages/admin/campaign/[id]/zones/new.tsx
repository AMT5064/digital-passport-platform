import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, MapPin, AlertCircle } from 'lucide-react'

export default function CreateZonePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    qrSlug: '',
    points: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name || !formData.qrSlug) {
        setError('Zone name and QR slug are required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventId: campaignId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create zone')
        setLoading(false)
        return
      }

      router.push(`/admin/campaign/${campaignId}?tab=zones`)
    } catch (err: any) {
      setError(err.message || 'Error creating zone')
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
            <MapPin className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold">Create New Zone</h1>
              <p className="text-sm text-gray-400">Add a new QR code zone to your campaign</p>
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
              <label className="block text-sm font-semibold text-white mb-3">Zone Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder="e.g., Registration Desk, Hall A"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">QR Code Slug <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.qrSlug}
                onChange={(e) => setFormData({ ...formData, qrSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder="e.g., registration, hall-a"
              />
              <p className="text-xs text-gray-400 mt-2">Used for QR code identification (lowercase, no spaces)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
                rows={4}
                placeholder="Describe this zone..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Points Awarded</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-white text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                min="0"
              />
              <p className="text-xs text-gray-400 mt-2">Points participants earn when scanning this zone</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-white text-base"
              >
                {loading ? 'Creating...' : 'Create Zone'}
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
