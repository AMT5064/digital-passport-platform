import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Download, Printer, Link2, ExternalLink, Check, Plus, Pencil } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import BoothQR from '@/components/admin/BoothQR'
import { boothUrl, downloadQr } from '@/lib/qr'

const POINT_PRESETS = [5, 10, 15, 20, 25, 50]

export default function EditBoothPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId, zoneId } = router.query
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [zone, setZone] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', points: 10 })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!campaignId || !zoneId) return
    fetch(`/api/zones?eventId=${campaignId}`)
      .then((r) => r.json())
      .then((zones) => {
        const z = (Array.isArray(zones) ? zones : []).find((x: any) => x.id === zoneId)
        if (!z) throw new Error('Booth not found')
        setZone(z)
        setFormData({ name: z.name || '', description: z.description || '', points: z.points ?? 10 })
      })
      .catch((err) => setError(err.message || 'Failed to load booth'))
      .finally(() => setFetching(false))
  }, [campaignId, zoneId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.name.trim()) {
      setError('Booth name is required')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: zoneId, ...formData, name: formData.name.trim() }),
      })
      if (!response.ok) {
        setError((await response.json()).error || 'Failed to update booth')
        setLoading(false)
        return
      }
      router.push(`/admin/campaign/${campaignId}?tab=booths`)
    } catch (err: any) {
      setError(err.message || 'Error updating booth')
      setLoading(false)
    }
  }

  if (!campaignId || fetching) {
    return (
      <div className="min-h-screen bg-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  const url = zone ? boothUrl(zone.qrSlug) : ''
  const activity = zone?.activities?.[0]
  const inputClass =
    'w-full px-4 py-3 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none focus:ring-2 focus:ring-[#00CBB3]/30 transition-all'
  const labelClass = 'block text-sm font-semibold text-white mb-2'
  const actionClass = 'flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/15 hover:bg-white/5 text-sm'

  return (
    <div className="min-h-screen bg-[#16123D] text-white font-poppins pb-12">
      <AdminHeader />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link href={`/admin/campaign/${campaignId}?tab=booths`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to booths
        </Link>
        <h1 className="text-2xl font-oswald font-bold mb-6">Edit booth</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {zone && (
          <div className="grid md:grid-cols-[1fr_260px] gap-6 items-start">
            <form onSubmit={handleSubmit} className="bg-white/[0.035] ring-1 ring-white/[0.06] rounded-2xl p-6 space-y-6">
              <div>
                <label className={labelClass}>Booth name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
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
                <p className="text-xs text-gray-400 mt-2">Changing points only affects completions from now on.</p>
              </div>
              <div>
                <label className={labelClass}>
                  Notes <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass + ' resize-none'} rows={2} />
              </div>

              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Activity</p>
                  <p className="text-sm font-semibold truncate">{activity ? `${activity.type} · ${activity.title}` : 'None yet'}</p>
                </div>
                <Link
                  href={activity ? `/admin/campaign/${campaignId}/activities/${activity.id}/edit` : `/admin/campaign/${campaignId}/activities/new?zoneId=${zone.id}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#00CBB3]"
                >
                  {activity ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {activity ? 'Edit' : 'Add'}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-[#16123D]">
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
                <Link href={`/admin/campaign/${campaignId}?tab=booths`} className="flex-1 text-center px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/5">
                  Cancel
                </Link>
              </div>
            </form>

            <aside className="bg-white/[0.035] ring-1 ring-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold">QR code</p>
              <BoothQR value={url} size={220} className="mx-auto" />
              <p className="text-[11px] text-gray-400 break-all text-center font-mono">{url}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => downloadQr(url, zone.name)} className={actionClass}>
                  <Download className="w-4 h-4 text-[#00CBB3]" /> PNG
                </button>
                <Link href={`/admin/campaign/${campaignId}/print?zone=${zone.id}`} className={actionClass}>
                  <Printer className="w-4 h-4 text-[#00CBB3]" /> Sign
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(url)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className={actionClass}
                >
                  {copied ? <Check className="w-4 h-4 text-[#00CBB3]" /> : <Link2 className="w-4 h-4 text-[#00CBB3]" />} {copied ? 'Copied' : 'Link'}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className={actionClass}>
                  <ExternalLink className="w-4 h-4 text-[#00CBB3]" /> Test
                </a>
              </div>
              <p className="text-[11px] text-gray-500">The code never changes, so signs you&apos;ve already printed keep working after edits.</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
