import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ActivityForm, { stateFromActivity } from '@/components/admin/ActivityForm'
import AdminHeader from '@/components/admin/AdminHeader'

export default function EditActivityPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId, activityId } = router.query
  const [zones, setZones] = useState<any[]>([])
  const [activity, setActivity] = useState<any>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!campaignId || !activityId) return
    fetch(`/api/zones?eventId=${campaignId}`)
      .then((r) => r.json())
      .then((d) => setZones(Array.isArray(d) ? d : []))
      .catch((err) => console.error('Error fetching zones:', err))
    fetch(`/api/activities?id=${activityId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Activity not found'))))
      .then(setActivity)
      .catch(() => setLoadError('Failed to load activity'))
  }, [campaignId, activityId])

  const handleSubmit = async (payload: any) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: activityId }),
      })
      if (!response.ok) {
        const data = await response.json()
        return data.error || 'Failed to update activity'
      }
      router.push(`/admin/campaign/${campaignId}?tab=booths`)
    } catch (err: any) {
      return err.message || 'Error updating activity'
    }
  }

  if (!campaignId || (!activity && !loadError)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-12">
      <AdminHeader />
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link href={`/admin/campaign/${campaignId}?tab=booths`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to booths
        </Link>
        <h1 className="text-2xl font-oswald font-bold mb-1">Edit activity</h1>
        <p className="text-sm text-gray-400 mb-6">
          {activity?.zone?.name ? `At ${activity.zone.name}. ` : ''}Changes show to attendees straight away; answers already given are kept.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8">
          {loadError ? (
            <p className="text-red-300 text-sm">{loadError}</p>
          ) : (
            <ActivityForm
              zones={zones}
              initial={stateFromActivity(activity)}
              submitLabel="Save changes"
              submittingLabel="Saving..."
              cancelHref={`/admin/campaign/${campaignId}?tab=booths`}
              onSubmit={handleSubmit}
              currentActivityId={activity.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
