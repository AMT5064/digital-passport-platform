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
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (campaignId) {
      // Set active tab from query parameter if provided
      if (router.query.tab) {
        setActiveTab(router.query.tab as string)
      }
      fetchCampaignData()
    }
  }, [status, campaignId, router])

  // Update tab when query parameter changes
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string)
    }
  }, [router.query.tab])

  const fetchCampaignData = async () => {
    try {
      const [eventsRes, zonesRes, activitiesRes, participantsRes] = await Promise.all([
        fetch('/api/events'),
        fetch(`/api/zones?eventId=${campaignId}`),
        fetch(`/api/activities?eventId=${campaignId}`),
        fetch(`/api/participants?eventId=${campaignId}`),
      ])

      const events = await eventsRes.json()
      const event = events.find((e: any) => e.id === campaignId)
      setCampaign(event || null)

      const zonesData = await zonesRes.json()
      setZones(zonesData)

      const activitiesData = await activitiesRes.json()
      setActivities(activitiesData)

      const participantsData = await participantsRes.json()
      setParticipants(participantsData)
    } catch (error) {
      console.error('Error fetching campaign data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <Link href="/admin">
            <button className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg">
              Back to Admin
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <p className="text-xs text-gray-400">{campaign.venue}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/campaign/${campaignId}/settings`}>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-6 h-6" />
              </button>
            </Link>
            <button onClick={handleDeleteCampaign} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300">
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={MapPin} label="Zones" value={campaign._count?.zones || 0} />
          <StatCard icon={Gamepad2} label="Activities" value={activities.length} />
          <StatCard icon={Users} label="Participants" value={campaign._count?.attendees || 0} />
          <StatCard icon={BarChart3} label="Total Scans" value={campaign._count?.scans || 0} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Calendar },
            { id: 'zones', label: 'Zones', icon: MapPin },
            { id: 'activities', label: 'Activities', icon: Gamepad2 },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
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
          {activeTab === 'overview' && <OverviewTab campaign={campaign} zones={zones} activities={activities} participants={participants} />}
          {activeTab === 'zones' && <ZonesTab campaignId={campaignId as string} zones={zones} onDeleteZone={handleDeleteZone} onRefresh={fetchCampaignData} />}
          {activeTab === 'activities' && <ActivitiesTab campaignId={campaignId as string} activities={activities} zones={zones} onDeleteActivity={handleDeleteActivity} onRefresh={fetchCampaignData} />}
          {activeTab === 'participants' && <ParticipantsTab participants={participants} />}
          {activeTab === 'analytics' && <AnalyticsTab campaign={campaign} />}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ campaign, zones, activities, participants }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Campaign Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Start Date</p>
                <p className="font-semibold">{new Date(campaign.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">End Date</p>
                <p className="font-semibold">{new Date(campaign.endDate).toLocaleDateString()}</p>
              </div>
            </div>
            {campaign.description && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Description</p>
                <p className="text-gray-300">{campaign.description}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-sm mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                campaign.status === 'LIVE' ? 'bg-green-500/20 text-green-300' :
                campaign.status === 'PUBLISHED' ? 'bg-blue-500/20 text-blue-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {campaign.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionButton icon={MapPin} label="Add Zone" href={`/admin/campaign/${campaign.id}/zones`} />
            <QuickActionButton icon={Gamepad2} label="Add Activity" href={`/admin/campaign/${campaign.id}/activities`} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Campaign Stats</h3>
          <div className="space-y-3">
            <StatItem label="Total Zones" value={zones.length} />
            <StatItem label="Total Activities" value={activities.length} />
            <StatItem label="Total Participants" value={participants.length} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}

function QuickActionButton({ icon: Icon, label, href }: any) {
  return (
    <Link href={href}>
      <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-4 py-3 transition-all font-medium text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </button>
    </Link>
  )
}

function ZonesTab({ campaignId, zones, onRefresh, onDeleteZone }: any) {

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Zones</h3>
        <Link href={`/admin/campaign/${campaignId}/zones/new`}>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#00CBB3] to-[#00CBB3] hover:from-primary-dark hover:to-primary-dark px-4 py-2 rounded-lg font-semibold">
            <Plus className="w-5 h-5" />
            New Zone
          </button>
        </Link>
      </div>

      {zones.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No zones yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{zone.name}</h4>
                <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-semibold">{zone.points} pts</span>
              </div>
              {zone.description && <p className="text-sm text-gray-400 mb-2">{zone.description}</p>}
              <p className="text-xs text-gray-500 mb-3">QR: {zone.qrSlug}</p>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 px-3 py-2 rounded text-sm transition-colors">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => onDeleteZone(zone.id, zone.name)} className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-3 py-2 rounded text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivitiesTab({ campaignId, activities, zones, onRefresh, onDeleteActivity }: any) {

  const getActivityTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      QUIZ: 'bg-blue-600 text-white',
      POLL: 'bg-purple-600 text-white',
      SURVEY: 'bg-pink-600 text-white',
      DOWNLOAD: 'bg-green-600 text-white',
      VIDEO: 'bg-orange-600 text-white',
      RAFFLE: 'bg-red-600 text-white',
      CUSTOM_CTA: 'bg-cyan-600 text-white',
    }
    return colors[type] || 'bg-gray-600 text-white'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Activities</h3>
        <Link href={`/admin/campaign/${campaignId}/activities/new`}>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#00CBB3] to-[#00CBB3] hover:from-primary-dark hover:to-primary-dark px-4 py-2 rounded-lg font-semibold">
            <Plus className="w-5 h-5" />
            New Activity
          </button>
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-8 text-center">
          <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No activities yet. Create one to engage participants!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{activity.zone?.name}</h4>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getActivityTypeBadge(activity.type)}`}>{activity.type}</span>
              </div>
              {activity.question && <p className="text-sm text-gray-300 mb-3">{activity.question}</p>}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 px-3 py-2 rounded text-sm transition-colors">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => onDeleteActivity(activity.id, activity.type)} className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-3 py-2 rounded text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ParticipantsTab({ participants }: any) {
  const totalPoints = participants.reduce((sum: number, p: any) => sum + p.scans.reduce((s: number, scan: any) => s + scan.pointsEarned, 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">Participants ({participants.length})</h3>
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
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No participants yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-900/40 to-purple-900/40">
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
                    <td className="px-6 py-4 text-sm font-bold text-yellow-400">{points}</td>
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

function AnalyticsTab({ campaign }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-6">Campaign Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnalyticsCard title="Total Scans" value="0" change="+0%" />
        <AnalyticsCard title="Engagement Rate" value="0%" change="+0%" />
        <AnalyticsCard title="Active Participants" value="0" change="+0%" />
      </div>
    </div>
  )
}

function AnalyticsCard({ title, value, change }: any) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold">{value}</p>
        <span className="text-green-400 text-sm">{change}</span>
      </div>
    </div>
  )
}
