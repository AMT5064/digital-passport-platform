import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Palette, Users } from 'lucide-react'
import { AdminPage, PageTitle, panel } from '@/components/admin/ui'

export default function CampaignSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (!campaignId) return null
  const isSuper = session?.user?.role === 'SUPER_ADMIN'

  return (
    <AdminPage width="max-w-2xl">
      <div>
        <Link href={`/admin/campaign/${campaignId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to event
        </Link>
        <PageTitle title="Event settings" />
      </div>

      <div className={`${panel} p-6 space-y-3`}>
        <h2 className="text-[15px] font-poppins font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" /> How scoring works
        </h2>
        <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
            <li>Each attendee can complete each booth once. Scanning it again shows &quot;Already completed&quot;, so nobody can farm points.</li>
            <li>Finishing a booth earns its points. A wrong quiz answer earns 0 but still counts as visited.</li>
            <li>Equal points rank by who reached the score first, then who played fastest.</li>
        </ul>
      </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link href={`/admin/campaign/${campaignId}/branding`} className={`${panel} p-4 hover:bg-white/[0.06] flex items-center gap-3`}>
            <Palette className="w-5 h-5 text-gray-400" />
            <span className="text-sm">
              <span className="font-medium text-white block">Branding & registration</span>
              <span className="text-gray-500 text-xs">Banner, colours, form fields</span>
            </span>
          </Link>
          {isSuper && (
            <Link href="/admin/team" className={`${panel} p-4 hover:bg-white/[0.06] flex items-center gap-3`}>
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                <span className="font-medium text-white block">Event admins</span>
                <span className="text-gray-500 text-xs">Give a teammate access to this event</span>
              </span>
            </Link>
          )}
        </div>

        <ClearRecords eventId={campaignId as string} />
    </AdminPage>
  )
}

// Wipes an event's activity so it can be rehearsed and then run for real
function ClearRecords({ eventId }: { eventId: string }) {
  const [eventName, setEventName] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [removeParticipants, setRemoveParticipants] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((events) => setEventName(Array.isArray(events) ? events.find((e: any) => e.id === eventId)?.name || '' : ''))
      .catch(() => {})
  }, [eventId])

  const clear = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/events-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, confirmName, removeParticipants }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to clear records')
      const c = data.cleared
      setMessage({
        ok: true,
        text: `Cleared ${c.scans} booth completions and ${c.answers} answers${removeParticipants ? `, and removed ${c.participants} participants` : ''}. Booths and activities are unchanged.`,
      })
      setConfirmName('')
    } catch (err: any) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-red-500/25 p-6 space-y-4">
      <div>
        <h2 className="text-[15px] font-poppins font-semibold text-red-300">Clear records</h2>
        <p className="text-sm text-gray-400 mt-1">
          Deletes every booth completion, point, answer and leaderboard entry for this event, for example after a rehearsal. Booths, activities,
          branding and settings stay. Export anything you need first; this can&apos;t be undone.
        </p>
      </div>
      <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
        <input type="checkbox" checked={removeParticipants} onChange={(e) => setRemoveParticipants(e.target.checked)} className="w-4 h-4 mt-0.5 accent-red-500" />
        Also delete the participants&apos; accounts (they will need to register again)
      </label>
      <div>
        <label className="block text-sm text-gray-300 mb-2">
          Type <strong className="text-white">{eventName || 'the event name'}</strong> to confirm
        </label>
        <input
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          className="w-full px-4 py-2.5 bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg text-white focus:ring-red-400/60 focus:outline-none"
        />
      </div>
      {message && <p className={`text-sm ${message.ok ? 'text-green-300' : 'text-red-300'}`}>{message.text}</p>}
      <button
        onClick={clear}
        disabled={busy || !eventName || confirmName.trim() !== eventName}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-sm"
      >
        {busy ? 'Clearing...' : 'Clear records'}
      </button>
    </div>
  )
}
