import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Gamepad2,
  Users,
  BarChart3,
  Settings,
  Palette,
  Plus,
  Edit2,
  Trash2,
  Trophy,
  QrCode,
  Monitor,
} from 'lucide-react'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import { AnalyticsPanel, CampaignStats, EventDayChecklist, ExportButtons, LeaderboardPanel, SetupChecklist, StatTiles } from '@/components/admin/CampaignPanels'
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

interface TabContent {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ReactNode
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-oswald font-bold mb-4">Campaign Not Found</h1>
          <Link href="/admin">
            <button className="bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-6 py-2 rounded-lg font-semibold">
              Back to Admin
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      <AdminHeader />
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/admin" aria-label="Back to dashboard">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-oswald font-bold truncate">{campaign.name}</h1>
              <p className="text-xs text-gray-400 truncate">{campaign.venue}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/screen/${campaignId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00CBB3] text-[#16123D] text-sm font-semibold"
            >
              <Monitor className="w-5 h-5" />
              <span>Big screen</span>
            </a>
            <Link
              href={`/admin/campaign/${campaignId}/branding`}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-semibold"
            >
              <Palette className="w-5 h-5 text-[#00CBB3]" />
              <span className="hidden sm:inline">Branding & Registration</span>
            </Link>
            <Link href={`/admin/campaign/${campaignId}/settings`} aria-label="Campaign settings">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-6 h-6" />
              </button>
            </Link>
            {isSuper && (
              <button onClick={handleDeleteCampaign} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300" aria-label="Delete event">
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats */}
        {stats && (
          <div className="mb-8">
            <StatTiles stats={stats} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Setup', icon: Calendar },
            { id: 'booths', label: `Booths & QR codes (${zones.length})`, icon: QrCode },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#00CBB3] text-[#00CBB3]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && stats && (
            <div className="grid xl:grid-cols-2 gap-6 items-start">
              <SetupChecklist eventId={campaignId as string} stats={stats} />
              <EventDayChecklist eventId={campaignId as string} stats={stats} />
            </div>
          )}
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
          {activeTab === 'participants' && <ParticipantsTab participants={participants} eventId={campaignId as string} />}
          {activeTab === 'leaderboard' && stats && <LeaderboardPanel eventId={campaignId as string} stats={stats} />}
          {activeTab === 'analytics' && stats && <AnalyticsPanel eventId={campaignId as string} stats={stats} />}
        </div>
      </div>
    </div>
  )
}

function ParticipantsTab({ participants, eventId }: any) {
  const totalPoints = participants.reduce((sum: number, p: any) => sum + p.scans.reduce((s: number, scan: any) => s + scan.pointsEarned, 0), 0)

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold">Participants ({participants.length})</h3>
          <ExportButtons eventId={eventId} types={[{ type: 'participants', label: 'Export with registration answers' }]} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-2">Total Participants</p>
            <p className="text-2xl font-bold">{participants.length}</p>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-2">Total Points</p>
            <p className="text-2xl font-bold">{totalPoints}</p>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-2">Avg Points</p>
            <p className="text-2xl font-bold">{participants.length > 0 ? Math.round(totalPoints / participants.length) : 0}</p>
          </div>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="bg-gradient-to-br from-[#7600FF]/10 to-[#00CBB3]/10 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No participants yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead className="bg-[#16123D]">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Scans</th>
                <th className="px-6 py-3 text-left font-semibold">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {participants.map((p) => {
                const points = p.scans.reduce((s: number, scan: any) => s + scan.pointsEarned, 0)
                return (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-semibold">{p.firstName} {p.lastName}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{p.email}</td>
                    <td className="px-6 py-4 text-sm">{p.scans.length}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#FFB800]">{points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
