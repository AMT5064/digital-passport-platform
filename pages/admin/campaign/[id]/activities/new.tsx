import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import ActivityForm from '@/components/admin/ActivityForm'

export default function CreateActivityPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query
  const [zones, setZones] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!campaignId) return
    fetch(`/api/zones?eventId=${campaignId}`)
      .then((r) => r.json())
      .then(setZones)
      .catch((err) => console.error('Error fetching zones:', err))
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
      router.push(`/admin/campaign/${campaignId}?tab=activities`)
    } catch (err: any) {
      return err.message || 'Error creating activity'
    }
  }

  if (!campaignId) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/admin/campaign/${campaignId}?tab=activities`}>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-[#00CBB3]" />
            <div>
              <h1 className="text-2xl font-oswald font-bold">Create New Activity</h1>
              <p className="text-sm text-gray-400">Pick a type and the matching options appear below</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 sm:p-8">
          <ActivityForm
            zones={zones}
            submitLabel="Create Activity"
            submittingLabel="Creating..."
            cancelHref={`/admin/campaign/${campaignId}?tab=activities`}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
