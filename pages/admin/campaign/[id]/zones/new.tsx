import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, ChevronDown } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'

const POINT_PRESETS = [5, 10, 15, 20, 25, 50]

export default function CreateBoothPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', qrSlug: '', points: 10 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.name.trim()) {
      setError('Give the booth a name')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, qrSlug: formData.qrSlug || undefined, eventId: campaignId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to create booth')
        setLoading(false)
        return
      }
      // Straight on to the activity, which is what makes the booth worth scanning
      router.push(`/admin/campaign/${campaignId}/activities/new?zoneId=${data.id}&created=1`)
    } catch (err: any) {
      setError(err.message || 'Error creating booth')
      setLoading(false)
    }
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }
  if (!campaignId) return null

  const inputClass =
    'w-full px-4 py-3 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none focus:ring-2 focus:ring-[#00CBB3]/30 transition-all'
  const labelClass = 'block text-sm font-semibold text-white mb-2'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-12">
      <AdminHeader />
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link href={`/admin/campaign/${campaignId}?tab=booths`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to booths
        </Link>
        <h1 className="text-2xl font-oswald font-bold">Add a booth</h1>
        <p className="text-sm text-gray-400 mb-6">Step 1 of 2: name it and set its points. Next you&apos;ll pick what attendees do there. The QR code is created for you.</p>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Booth name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
              className={inputClass}
              placeholder="e.g. AI Demo Booth, Registration Desk, Photo Wall"
            />
            <p className="text-xs text-gray-400 mt-2">Printed in large type on the QR sign, so keep it short.</p>
          </div>

          <div>
            <label className={labelClass}>Points for completing it</label>
            <div className="flex flex-wrap gap-2">
              {POINT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, points: p })}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold ${formData.points === p ? 'border-[#00CBB3] bg-[#00CBB3]/15 text-[#00CBB3]' : 'border-white/15 hover:border-white/30'}`}
                >
                  {p}
                </button>
              ))}
              <input
                type="number"
                min={0}
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-24 px-3 py-2 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm"
                aria-label="Custom points"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Give more points to booths that take longer or matter more to you.</p>
          </div>

          <div>
            <label className={labelClass}>
              Notes <span className="text-gray-500 font-normal">(optional, shown under the booth name)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass + ' resize-none'}
              rows={2}
              placeholder="e.g. Next to Hall B entrance"
            />
          </div>

          <div>
            <button type="button" onClick={() => setAdvanced(!advanced)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
              <ChevronDown className={`w-4 h-4 transition-transform ${advanced ? 'rotate-180' : ''}`} /> Advanced
            </button>
            {advanced && (
              <div className="mt-3">
                <label className={labelClass}>Custom QR code ID</label>
                <input
                  type="text"
                  value={formData.qrSlug}
                  onChange={(e) => setFormData({ ...formData, qrSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                  className={inputClass + ' font-mono'}
                  placeholder="leave empty to generate one"
                />
                <p className="text-xs text-gray-400 mt-2">Appears in the booth link. It can&apos;t be changed later, because printed codes would stop working.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-[#16123D]"
            >
              {loading ? 'Creating...' : 'Create booth & choose activity'}
            </button>
            <Link href={`/admin/campaign/${campaignId}?tab=booths`} className="flex-1 text-center px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/5">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
