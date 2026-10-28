import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import ActivityForm, { emptyState } from '@/components/admin/ActivityForm'
import AdminHeader from '@/components/admin/AdminHeader'

export default function CreateActivityPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId, zoneId, created } = router.query
  const [zones, setZones] = useState<any[] | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!campaignId) return
    fetch(`/api/zones?eventId=${campaignId}`)
      .then((r) => r.json())
      .then((d) => setZones(Array.isArray(d) ? [...d].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []))
      .catch((err) => console.error('Error fetching booths:', err))
  }, [campaignId])

  const handleSubmit = async (payload: any) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, eventId: campaignId }),
      })
      if (!response.ok) {
        const data = await response.json()
        return data.error || 'Failed to create activity'
      }
      router.push(`/admin/campaign/${campaignId}?tab=booths`)
    } catch (err: any) {
      return err.message || 'Error creating activity'
    }
  }

  if (!campaignId || !zones) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  // Coming from a booth card or a just-created booth, that booth is already picked
  const booth = zones.find((z) => z.id === zoneId)
  const initial = { ...emptyState(), zoneId: booth && !booth.activities?.length ? booth.id : '' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-12">
      <AdminHeader />
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link href={`/admin/campaign/${campaignId}?tab=booths`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to booths
        </Link>
        {created && booth && (
          <div className="mb-4 p-3 rounded-lg bg-[#00CBB3]/10 border border-[#00CBB3]/40 text-sm text-[#00CBB3] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Booth &quot;{booth.name}&quot; created with its QR code.
          </div>
        )}
        <h1 className="text-2xl font-oswald font-bold">{booth ? `What happens at ${booth.name}?` : 'Add an activity'}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {created ? 'Step 2 of 2: ' : ''}pick what attendees do when they scan the booth&apos;s QR code. They earn the booth&apos;s points when they finish.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8">
          <ActivityForm
            zones={zones}
            initial={initial}
            submitLabel="Save activity"
            submittingLabel="Saving..."
            cancelHref={`/admin/campaign/${campaignId}?tab=booths`}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
