import React, { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, MapPin, AlertCircle, Download } from 'lucide-react'
import QRCode from 'qrcode.react'

export default function EditZonePage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId, zoneId } = router.query
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    qrSlug: '',
    points: 10,
  })
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (zoneId) fetchZone()
  }, [zoneId])

  const fetchZone = async () => {
    try {
      const res = await fetch(`/api/zones?eventId=${campaignId}`)
      const zones = await res.json()
      const zone = zones.find((z: any) => z.id === zoneId)
      if (zone) {
        setFormData({
          name: zone.name || '',
          description: zone.description || '',
          qrSlug: zone.qrSlug || '',
          points: zone.points || 10,
        })
      } else {
        setError('Zone not found')
      }
    } catch (err) {
      setError('Failed to load zone')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name) {
        setError('Zone name is required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: zoneId,
          name: formData.name,
          description: formData.description,
          points: formData.points,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update zone')
        setLoading(false)
        return
      }

      router.push(`/admin/campaign/${campaignId}?tab=zones`)
    } catch (err: any) {
      setError(err.message || 'Error updating zone')
      setLoading(false)
    }
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.qrSlug || 'zone'}-qr.png`
    a.click()
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (!campaignId || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  const scanUrl = formData.qrSlug && typeof window !== 'undefined' ? `${window.location.origin}/scan/${formData.qrSlug}` : ''
  const inputClass = "w-full px-4 py-3 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none focus:ring-2 focus:ring-[#00CBB3]/30 transition-all"
  const disabledInputClass = "w-full px-4 py-3 bg-[#16123D]/30 border border-white/10 rounded-lg text-gray-400 text-base cursor-not-allowed"
  const labelClass = "block text-sm font-semibold text-white mb-3"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/admin/campaign/${campaignId}`}>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-[#00CBB3]" />
            <div>
              <h1 className="text-2xl font-oswald font-bold">Edit Zone</h1>
              <p className="text-sm text-gray-400">Update zone details & get QR code</p>
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
              <label className={labelClass}>Zone Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>QR Code Slug</label>
              <input type="text" value={formData.qrSlug} disabled className={disabledInputClass} />
              <p className="text-xs text-gray-400 mt-2">QR slug cannot be changed after creation</p>
            </div>

            {scanUrl && (
              <div ref={qrRef} className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg">
                <QRCode value={scanUrl} size={180} fgColor="#16123D" />
                <p className="text-xs text-[#16123D] break-all text-center">{scanUrl}</p>
                <button
                  type="button"
                  onClick={downloadQR}
                  className="flex items-center gap-2 bg-[#16123D] hover:bg-[#0f0c2e] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" /> Download QR Code
                </button>
              </div>
            )}

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass + " resize-none"}
                rows={4}
              />
            </div>

            <div>
              <label className={labelClass}>Points Awarded</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className={inputClass}
                min="0"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#00CBB3] to-[#00CBB3] hover:from-[#009B8A] hover:to-[#009B8A] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-[#16123D] text-base"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href={`/admin/campaign/${campaignId}`} className="flex-1">
                <button type="button" className="w-full bg-[#16123D] hover:bg-[#0f0c2e] px-6 py-3 rounded-lg transition-all font-semibold text-white text-base border border-white/20 hover:border-white/30">
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
