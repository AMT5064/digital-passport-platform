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
  X,
  Check,
} from 'lucide-react'
import BoothQR from './BoothQR'
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
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-oswald font-bold">Booths</h3>
          <p className="text-xs text-gray-400">
            {booths.length} booth{booths.length === 1 ? '' : 's'} · {booths.length - missing.length} ready · up to {totalPoints} pts per attendee
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/campaign/${campaignId}/zones/new`}
            className="flex items-center gap-2 bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add booth
          </Link>
          <button onClick={() => setBulkOpen(!bulkOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-sm font-semibold">
            <ListPlus className="w-4 h-4" /> Add several
          </button>
          {booths.length > 0 && (
            <Link
              href={`/admin/campaign/${campaignId}/print`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-sm font-semibold"
            >
              <Printer className="w-4 h-4" /> Print all QR signs
            </Link>
          )}
        </div>
      </div>

      {local && (
        <div className="p-3 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 text-sm text-[#FFD36B] flex gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          These QR codes point to {appOrigin()}, which phones at the venue can&apos;t reach. Download and print them from the live site.
        </div>
      )}

      {missing.length > 0 && booths.length > 0 && (
        <div className="p-3 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 text-sm text-[#FFD36B] flex flex-wrap items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 min-w-0">
            {missing.length} booth{missing.length > 1 ? 's have' : ' has'} no activity yet, so scanning {missing.length > 1 ? 'them' : 'it'} gives points for nothing: {missing.map((z) => z.name).join(', ')}
          </span>
          <Link href={`/admin/campaign/${campaignId}/activities/new?zoneId=${missing[0].id}`} className="font-semibold underline whitespace-nowrap">
            Add activity to {missing[0].name}
          </Link>
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
        <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-8 text-center space-y-3">
          <p className="font-semibold">No booths yet</p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            A booth is any touchpoint attendees visit: a stand, demo, desk or photo wall. Each one gets its own QR code and points. Add them one at
            a time, or several at once.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {booths.map((zone, i) => {
            const activity = zone.activities?.[0]
            const info = activity ? TYPE_INFO[activity.type] : null
            const url = boothUrl(zone.qrSlug)
            return (
              <div key={zone.id} className={`rounded-xl border overflow-hidden flex flex-col ${activity ? 'border-white/10 bg-white/[0.04]' : 'border-[#FFB800]/40 bg-[#FFB800]/[0.04]'}`}>
                <div className="p-4 flex gap-4">
                  <BoothQR value={url} size={128} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-semibold">BOOTH {i + 1}</p>
                        <h4 className="text-base font-bold leading-tight truncate" title={zone.name}>{zone.name}</h4>
                      </div>
                      <span className="text-xs bg-[#FFB800]/20 text-[#FFD36B] px-2 py-1 rounded-full font-bold whitespace-nowrap">{zone.points} pts</span>
                    </div>

                    {activity && info ? (
                      <div className="mt-2 flex items-center gap-2 text-sm min-w-0">
                        <info.icon className="w-4 h-4 flex-shrink-0" style={{ color: info.color }} />
                        <span className="text-xs font-semibold" style={{ color: info.color }}>{info.label}</span>
                        <span className="text-gray-300 truncate">{activity.title}</span>
                      </div>
                    ) : (
                      <Link
                        href={`/admin/campaign/${campaignId}/activities/new?zoneId=${zone.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFD36B] hover:underline"
                      >
                        <Plus className="w-4 h-4" /> Add an activity
                      </Link>
                    )}

                    <p className="mt-auto pt-2 text-xs text-gray-400">
                      {zone._count?.scans ?? 0} visit{(zone._count?.scans ?? 0) === 1 ? '' : 's'} · <span className="font-mono">{zone.qrSlug}</span>
                    </p>
                  </div>
                </div>

                {/* QR actions, the things you need on setup day */}
                <div className="grid grid-cols-4 border-t border-white/10 text-xs">
                  <QrAction icon={Download} label="PNG" onClick={() => downloadQr(url, `${eventName}-${i + 1}-${zone.name}`)} />
                  <QrAction icon={Printer} label="Print" href={`/admin/campaign/${campaignId}/print?zone=${zone.id}`} />
                  <QrAction icon={copied === zone.id ? Check : Link2} label={copied === zone.id ? 'Copied' : 'Link'} onClick={() => copy(url, zone.id)} />
                  <QrAction icon={ExternalLink} label="Test" href={url} external />
                </div>

                <div className="flex border-t border-white/10 text-xs">
                  <Link href={`/admin/campaign/${campaignId}/zones/${zone.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 hover:bg-white/5 text-gray-300">
                    <Pencil className="w-3.5 h-3.5" /> Booth
                  </Link>
                  {activity && (
                    <Link
                      href={`/admin/campaign/${campaignId}/activities/${activity.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 hover:bg-white/5 text-gray-300 border-l border-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Activity
                    </Link>
                  )}
                  {activity && (
                    <button
                      onClick={() => onDeleteActivity(activity.id, activity.title)}
                      className="px-3 flex items-center justify-center gap-1.5 hover:bg-red-500/10 text-red-300 border-l border-white/10"
                      title="Remove activity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteZone(zone.id, zone.name)}
                    className="px-3 flex items-center justify-center gap-1.5 hover:bg-red-500/10 text-red-300 border-l border-white/10"
                    title="Delete booth"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function QrAction({ icon: Icon, label, onClick, href, external }: { icon: React.ElementType; label: string; onClick?: () => void; href?: string; external?: boolean }) {
  const cls = 'flex flex-col items-center justify-center gap-1 py-2.5 hover:bg-white/5 text-gray-200 border-r border-white/10 last:border-r-0'
  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        <Icon className="w-4 h-4 text-[#00CBB3]" /> {label}
      </a>
    ) : (
      <Link href={href} className={cls}>
        <Icon className="w-4 h-4 text-[#00CBB3]" /> {label}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      <Icon className="w-4 h-4 text-[#00CBB3]" /> {label}
    </button>
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
    <div className="p-5 rounded-xl border border-[#00CBB3]/40 bg-[#00CBB3]/5 space-y-3">
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
