import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { ArrowLeft, Monitor, Printer, MoreHorizontal, Palette, Pencil, Settings, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { AnalyticsPanel, CampaignStats, ExportMenu, LeaderboardPanel, OverviewPanel, SearchBox } from '@/components/admin/CampaignPanels'
import { AdminPage, EmptyState, Menu, MenuItem, PageTitle, PhaseBadge, Spinner, btn, eventPhase, panel } from '@/components/admin/ui'
import BoothsPanel from '@/components/admin/BoothsPanel'

// Booths and their activities live on one tab now; old links still land there
const tabFromQuery = (tab: unknown) => (tab === 'zones' || tab === 'activities' ? 'booths' : typeof tab === 'string' ? tab : 'overview')

interface Campaign {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  venue?: string
  status: string
  themeColor?: string
  _count?: {
    zones: number
    attendees: number
    scans: number
  }
}

export default function CampaignDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [zones, setZones] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const isSuper = session?.user?.role === 'SUPER_ADMIN'

  const handleDeleteCampaign = async () => {
    if (!confirm(`Delete campaign "${campaign?.name}"? This action cannot be undone.`)) return
    try {
      const res = await fetch(`/api/events-delete?id=${campaignId}`, { method: 'DELETE' })
      if (res.ok) {
        await logAuditAction('delete', 'campaign', campaignId as string, campaign?.name)
        router.push('/admin')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const logAuditAction = async (action: string, entityType: string, entityId: string, entityName?: string) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entityType,
          entityId,
          entityName,
          campaignId,
          userId: (session as any)?.user?.email,
        }),
      })
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }

  const handleDeleteZone = async (id: string, name?: string) => {
    if (!confirm(`Delete the booth "${name}"? Its QR code will stop working and its activity is deleted too. This can't be undone.`)) return
    try {
      const res = await fetch(`/api/zones-delete?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await logAuditAction('delete', 'zone', id, name)
        fetchCampaignData()
      }
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }

  const handleDeleteActivity = async (id: string, name?: string) => {
    if (!confirm(`Remove the activity "${name}" from its booth? You can add a new one afterwards.`)) return
    try {
      const res = await fetch(`/api/activities-delete?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await logAuditAction('delete', 'activity', id, name)
        fetchCampaignData()
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Load once the session is confirmed; loading during the session check fetched everything twice
  useEffect(() => {
    if (status === 'authenticated' && campaignId) fetchCampaignData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, campaignId])

  // Update tab when query parameter changes
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(tabFromQuery(router.query.tab))
    }
  }, [router.query.tab])

  const fetchCampaignData = async () => {
    try {
      const [eventsRes, zonesRes, activitiesRes, participantsRes, statsRes] = await Promise.all([
        fetch('/api/events'),
        fetch(`/api/zones?eventId=${campaignId}`),
        fetch(`/api/activities?eventId=${campaignId}`),
        fetch(`/api/participants?eventId=${campaignId}`),
        fetch(`/api/stats/event?eventId=${campaignId}`),
      ])

      const list = (d: any) => (Array.isArray(d) ? d : [])
      const events = list(await eventsRes.json())
      setCampaign(events.find((e: any) => e.id === campaignId) || null)
      setZones(list(await zonesRes.json()))
      setActivities(list(await activitiesRes.json()))
      setParticipants(list(await participantsRes.json()))
      setStats(statsRes.ok ? await statsRes.json() : null)
    } catch (error) {
      console.error('Error fetching campaign data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) return <Spinner />

  if (!campaign) {
    return (
      <AdminPage>
        <EmptyState
          title="Event not found"
          text="It may have been deleted, or you don't have access to it."
          action={
            <Link href="/admin" className={btn.primary}>
              Back to dashboard
            </Link>
          }
        />
      </AdminPage>
    )
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'booths', label: 'Booths', count: zones.length },
    { id: 'participants', label: 'People', count: participants.length },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'analytics', label: 'Analytics' },
  ]
  const selectTab = (tab: string) => {
    setActiveTab(tab)
    router.replace({ pathname: router.pathname, query: { id: campaignId, ...(tab === 'overview' ? {} : { tab }) } }, undefined, { shallow: true })
  }

  return (
    <AdminPage>
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> All events
        </Link>
        <PageTitle
          title={
            <span className="flex items-center gap-3 flex-wrap">
              {campaign.name} <PhaseBadge phase={eventPhase(campaign.startDate, campaign.endDate)} />
            </span>
          }
          subtitle={
            <>
              {fmt(campaign.startDate)} – {fmt(campaign.endDate)}
              {campaign.venue && ` · ${campaign.venue}`}
            </>
          }
          actions={
            <>
              <a href={`/screen/${campaignId}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
                <Monitor className="w-4 h-4" /> Big screen
              </a>
              <Link href={`/admin/campaign/${campaignId}/print`} className={btn.secondary}>
                <Printer className="w-4 h-4" /> Print signs
              </Link>
              <Menu icon={<MoreHorizontal className="w-5 h-5" />}>
                <MenuItem icon={Palette} href={`/admin/campaign/${campaignId}/branding`}>
                  Branding & registration form
                </MenuItem>
                <MenuItem icon={Pencil} href={`/admin/events?edit=${campaignId}`}>
                  Edit name, dates & venue
                </MenuItem>
                <MenuItem icon={Settings} href={`/admin/campaign/${campaignId}/settings`}>
                  Settings & clear records
                </MenuItem>
                <MenuItem icon={ExternalLink} href={`/register?event=${campaignId}`} external>
                  Preview registration page
                </MenuItem>
                {isSuper && (
                  <>
                    <div className="my-1.5 border-t border-white/[0.08]" />
                    <MenuItem icon={Trash2} onClick={handleDeleteCampaign} danger>
                      Delete event
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          }
        />
      </div>

      <div className="-mt-2">
        <div className="flex gap-6 border-b border-white/[0.08] overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`pb-3 -mb-px text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-[#00CBB3] text-white font-medium' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-1.5 text-xs text-gray-500">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="pt-8">
          {activeTab === 'overview' && stats && <OverviewPanel eventId={campaignId as string} stats={stats} onTab={selectTab} />}
          {activeTab === 'booths' && (
            <BoothsPanel
              campaignId={campaignId as string}
              eventName={campaign.name}
              zones={zones}
              onDeleteZone={handleDeleteZone}
              onDeleteActivity={handleDeleteActivity}
              onRefresh={fetchCampaignData}
            />
          )}
          {activeTab === 'participants' && <ParticipantsTab participants={participants} eventId={campaignId as string} boothCount={zones.length} />}
          {activeTab === 'leaderboard' && stats && <LeaderboardPanel eventId={campaignId as string} stats={stats} />}
          {activeTab === 'analytics' && stats && <AnalyticsPanel eventId={campaignId as string} stats={stats} />}
        </div>
      </div>
    </AdminPage>
  )
}

function ParticipantsTab({ participants, eventId, boothCount }: { participants: any[]; eventId: string; boothCount: number }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q ? participants.filter((p) => `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q)) : participants

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name or email" />
        <ExportMenu eventId={eventId} only={['participants']} />
      </div>

      {participants.length === 0 ? (
        <EmptyState title="No one has registered yet" text="Share the registration link or put the registration poster at the entrance." />
      ) : (
        <div className={`${panel} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 font-medium">Booths</th>
                <th className="px-5 py-3 font-medium text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {shown.map((p) => {
                const points = p.scans.reduce((s: number, scan: any) => s + scan.pointsEarned, 0)
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-white">
                      {p.firstName} {p.lastName}
                      <span className="block sm:hidden text-xs text-gray-500">{p.email}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{p.email}</td>
                    <td className="px-3 py-3 text-gray-300 tabular-nums">
                      {p.scans.length}
                      <span className="text-gray-500"> / {boothCount}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-[#FFB800] tabular-nums">{points}</td>
                  </tr>
                )
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    Nobody matches &quot;{query}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
