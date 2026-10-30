import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Printer,
  Download,
  Link2,
  ExternalLink,
  Pencil,
  Trash2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  ClipboardList,
  Gift,
  PlayCircle,
  MousePointerClick,
  ListPlus,
  MoreHorizontal,
  X,
  Check,
} from 'lucide-react'
import BoothQR from './BoothQR'
import { EmptyState, Menu, MenuItem, btn, panel } from './ui'
import { appOrigin, boothUrl, downloadQr, isLocalOrigin } from '@/lib/qr'

const TYPE_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  QUIZ: { label: 'Quiz', icon: HelpCircle, color: '#60A5FA' },
  POLL: { label: 'Poll', icon: BarChart3, color: '#C084FC' },
  SURVEY: { label: 'Survey', icon: ClipboardList, color: '#F472B6' },
  RAFFLE: { label: 'Raffle', icon: Gift, color: '#F87171' },
  DOWNLOAD: { label: 'Download', icon: Download, color: '#4ADE80' },
  VIDEO: { label: 'Video', icon: PlayCircle, color: '#FB923C' },
  CUSTOM_CTA: { label: 'Link', icon: MousePointerClick, color: '#22D3EE' },
}

interface Props {
  campaignId: string
  eventName: string
  zones: any[]
  onDeleteZone: (id: string, name?: string) => void
  onDeleteActivity: (id: string, name?: string) => void
  onRefresh: () => void
}

export default function BoothsPanel({ campaignId, eventName, zones, onDeleteZone, onDeleteActivity, onRefresh }: Props) {
  const [copied, setCopied] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)

  // Oldest first, so booth numbers match the order they were set up in
  const booths = useMemo(() => [...zones].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [zones])
  const missing = booths.filter((z) => !z.activities?.length)
  const totalPoints = booths.reduce((s, z) => s + (z.points || 0), 0)
  const [local, setLocal] = useState(false)
  useEffect(() => setLocal(isLocalOrigin(appOrigin())), [])

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {booths.length} booth{booths.length === 1 ? '' : 's'}
          {booths.length > 0 && ` · up to ${totalPoints} points per attendee`}
        </p>
        <div className="flex flex-wrap gap-2">
          {booths.length > 0 && (
            <Link href={`/admin/campaign/${campaignId}/print`} className={btn.secondary}>
              <Printer className="w-4 h-4" /> Print all signs
            </Link>
          )}
          <Link href={`/admin/campaign/${campaignId}/zones/new`} className={btn.primary}>
            <Plus className="w-4 h-4" /> Add booth
          </Link>
          <Menu icon={<MoreHorizontal className="w-5 h-5" />}>
            <MenuItem icon={ListPlus} onClick={() => setBulkOpen(true)}>
              Add several booths at once
            </MenuItem>
          </Menu>
        </div>
      </div>

      {(missing.length > 0 || local) && (
        <div className="space-y-1.5 text-sm">
          {missing.length > 0 && booths.length > 0 && (
            <p className="flex items-start gap-2 text-[#FFD36B]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {missing.length === 1 ? `${missing[0].name} has no activity yet.` : `${missing.length} booths have no activity yet.`}
            </p>
          )}
          {local && (
            <p className="flex items-start gap-2 text-gray-500">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              You&apos;re on {appOrigin().replace(/^https?:\/\//, '')}, so these codes only work on this computer. Print from the live site.
            </p>
          )}
        </div>
      )}

      {bulkOpen && (
        <BulkAdd
          campaignId={campaignId}
          onClose={() => setBulkOpen(false)}
          onDone={() => {
            setBulkOpen(false)
            onRefresh()
          }}
        />
      )}

      {booths.length === 0 ? (
        <EmptyState
          title="No booths yet"
          text="A booth is any touchpoint attendees visit: a stand, demo, desk or photo wall. Each gets its own QR code and points."
          action={
            <Link href={`/admin/campaign/${campaignId}/zones/new`} className={btn.primary}>
              <Plus className="w-4 h-4" /> Add your first booth
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {booths.map((zone, i) => {
            const activity = zone.activities?.[0]
            const info = activity ? TYPE_INFO[activity.type] : null
            const url = boothUrl(zone.qrSlug)
            const visits = zone._count?.scans ?? 0
            return (
              <div key={zone.id} className={`${panel} p-4 flex flex-col gap-4 ${activity ? '' : 'ring-[#FFB800]/40'}`}>
                <div className="flex gap-4">
                  <BoothQR value={url} size={96} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-500">Booth {i + 1} · {zone.points} pts</p>
                    <h4 className="text-[15px] font-poppins font-semibold text-white leading-snug mt-0.5 line-clamp-2" title={zone.name}>
                      {zone.name}
                    </h4>
                    {activity && info ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                        <info.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: info.color }} />
                        <span className="truncate">
                          {info.label} · {activity.title}
                        </span>
                      </p>
                    ) : (
                      <Link
                        href={`/admin/campaign/${campaignId}/activities/new?zoneId=${zone.id}`}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#FFD36B] hover:text-[#FFE39B]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add an activity
                      </Link>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {visits} visit{visits === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 -mx-1 -mb-1">
                  <button onClick={() => downloadQr(url, `${eventName}-${i + 1}-${zone.name}`)} className={btn.ghost + ' !px-2.5 text-xs'} title="Download the QR code as a PNG">
                    <Download className="w-4 h-4" /> QR
                  </button>
                  <Link href={`/admin/campaign/${campaignId}/print?zone=${zone.id}`} className={btn.ghost + ' !px-2.5 text-xs'} title="Print this booth's sign">
                    <Printer className="w-4 h-4" /> Sign
                  </Link>
                  <a href={url} target="_blank" rel="noopener noreferrer" className={btn.ghost + ' !px-2.5 text-xs'} title="Open the booth as an attendee would see it">
                    <ExternalLink className="w-4 h-4" /> Test
                  </a>
                  <span className="flex-1" />
                  <Link href={`/admin/campaign/${campaignId}/zones/${zone.id}/edit`} className={btn.icon} title="Edit booth" aria-label="Edit booth">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <Menu icon={<MoreHorizontal className="w-4 h-4" />}>
                    {activity && (
                      <MenuItem icon={Pencil} href={`/admin/campaign/${campaignId}/activities/${activity.id}/edit`}>
                        Edit activity
                      </MenuItem>
                    )}
                    <MenuItem icon={copied === zone.id ? Check : Link2} onClick={() => copy(url, zone.id)}>
                      Copy booth link
                    </MenuItem>
                    <div className="my-1.5 border-t border-white/[0.08]" />
                    {activity && (
                      <MenuItem icon={X} onClick={() => onDeleteActivity(activity.id, activity.title)} danger>
                        Remove activity
                      </MenuItem>
                    )}
                    <MenuItem icon={Trash2} onClick={() => onDeleteZone(zone.id, zone.name)} danger>
                      Delete booth
                    </MenuItem>
                  </Menu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Paste a list of booth names (optionally "Name, points") to create them in one go
function BulkAdd({ campaignId, onClose, onDone }: { campaignId: string; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState('')
  const [points, setPoints] = useState(10)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)[,\t]\s*(\d+)\s*(pts?)?$/i)
      return m ? { name: m[1].trim(), points: parseInt(m[2]) } : { name: line, points }
    })

  const create = async () => {
    setBusy(true)
    setError('')
    try {
      for (const r of rows) {
        const res = await fetch('/api/zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: campaignId, name: r.name, points: r.points }),
        })
        if (!res.ok) throw new Error(`${r.name}: ${(await res.json().catch(() => ({}))).error || 'failed'}`)
      }
      onDone()
    } catch (err: any) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className={`${panel} p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">Add several booths</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400">One booth per line. Add a comma and a number to set its points, e.g. &quot;AI Demo, 25&quot;. QR codes are created automatically.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'Registration Desk, 10\nAI Demo Booth, 25\nCloud Lounge\nPhoto Wall'}
        className="w-full px-3 py-2 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm font-mono placeholder-gray-600 focus:border-[#00CBB3] focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-300 flex items-center gap-2">
          Default points
          <input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1.5 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm"
          />
        </label>
        <button
          onClick={create}
          disabled={busy || rows.length === 0}
          className="ml-auto bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-40 text-[#16123D] px-4 py-2 rounded-lg font-semibold text-sm"
        >
          {busy ? 'Creating...' : `Create ${rows.length || ''} booth${rows.length === 1 ? '' : 's'}`}
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}
