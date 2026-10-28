import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react'
import { appOrigin, boothUrl, isLocalOrigin, qrDataUrl, registerUrl } from '@/lib/qr'
import { contrastText } from '@/lib/utils'

// What the attendee will do at the booth, in a few words for the sign
const ACTIVITY_HINT: Record<string, string> = {
  QUIZ: 'Answer a quick quiz',
  POLL: 'Vote in a 10-second poll',
  SURVEY: 'Share quick feedback',
  DOWNLOAD: 'Grab our brochure',
  VIDEO: 'Watch a short video',
  RAFFLE: 'Enter the prize draw',
  CUSTOM_CTA: 'Check in here',
}

interface Sign {
  key: string
  kind: 'register' | 'booth'
  number?: number
  title: string
  subtitle: string
  points?: number
  url: string
  qr: string
}

// Print-ready signs: one per booth plus a registration poster, A4 or A5, straight to the printer or PDF
export default function PrintSigns() {
  const router = useRouter()
  const { status } = useSession()
  const { id: eventId, zone: onlyZone } = router.query
  const [event, setEvent] = useState<any>(null)
  const [signs, setSigns] = useState<Sign[]>([])
  const [size, setSize] = useState<'A4' | 'A5'>('A4')
  const [withPoster, setWithPoster] = useState(!onlyZone)
  const [error, setError] = useState('')
  // Only known in the browser, so it's set after the first render to keep server and client in step
  const [local, setLocal] = useState(false)

  useEffect(() => {
    setLocal(isLocalOrigin(appOrigin()))
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!eventId || status !== 'authenticated') return
    ;(async () => {
      try {
        const [ev, zones] = await Promise.all([
          fetch(`/api/public/events/${eventId}`).then((r) => r.json()),
          fetch(`/api/zones?eventId=${eventId}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('No access to this event')))),
        ])
        setEvent(ev)
        const ordered = [...zones].sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt))
        const booths = await Promise.all(
          ordered.map(async (z: any, i: number) => ({
            key: z.id,
            kind: 'booth' as const,
            number: i + 1,
            title: z.name,
            subtitle: ACTIVITY_HINT[z.activities?.[0]?.type] || 'Visit this booth',
            points: z.points,
            url: boothUrl(z.qrSlug),
            qr: await qrDataUrl(boothUrl(z.qrSlug), 1200),
          }))
        )
        const poster: Sign = {
          key: 'register',
          kind: 'register',
          title: 'Get your digital passport',
          subtitle: `Visit all ${booths.length} booths, collect points and climb the leaderboard`,
          url: registerUrl(String(eventId)),
          qr: await qrDataUrl(registerUrl(String(eventId)), 1200),
        }
        setSigns([poster, ...booths])
      } catch (err: any) {
        setError(err.message || 'Failed to load the booths')
      }
    })()
  }, [eventId, status])

  const color = event?.themeColor || '#00CBB3'
  const shown = signs.filter((s) => (onlyZone ? s.key === onlyZone : s.kind === 'booth' || withPoster))
  const boothCount = signs.filter((s) => s.kind === 'booth').length

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white">
      <Head>
        <title>{`${event?.name || 'Event'} · QR signs`}</title>
      </Head>
      <style jsx global>{`
        @page {
          size: ${size} portrait;
          margin: 0;
        }
        @media print {
          html,
          body {
            background: white !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Controls, never printed */}
      <div className="print:hidden sticky top-0 z-10 bg-[#16123D] text-white font-poppins">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Link href={`/admin/campaign/${eventId}?tab=booths`} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Back to booths">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-oswald font-bold truncate">{onlyZone ? 'Print booth sign' : 'Print all QR signs'}</p>
            <p className="text-xs text-gray-400">
              {shown.length} page{shown.length === 1 ? '' : 's'} · one sign per page · use &quot;Save as PDF&quot; to send to a print shop
            </p>
          </div>
          <div className="flex rounded-lg border border-white/20 overflow-hidden text-sm">
            {(['A4', 'A5'] as const).map((s) => (
              <button key={s} onClick={() => setSize(s)} className={`px-3 py-1.5 ${size === s ? 'bg-white/15' : 'hover:bg-white/5'}`}>
                {s}
                <span className="text-[10px] text-gray-400 ml-1">{s === 'A4' ? 'poster' : 'table tent'}</span>
              </button>
            ))}
          </div>
          {!onlyZone && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={withPoster} onChange={(e) => setWithPoster(e.target.checked)} className="accent-[#00CBB3]" />
              Registration poster
            </label>
          )}
          <button
            onClick={() => window.print()}
            disabled={shown.length === 0}
            className="flex items-center gap-2 bg-[#00CBB3] text-[#16123D] px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-40"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
        {local && (
          <div className="bg-[#FFB800] text-[#16123D] text-sm px-4 py-2 flex items-center gap-2 justify-center">
            <AlertTriangle className="w-4 h-4" /> These codes point to {appOrigin()}. Print from the live site so phones at the venue can open them.
          </div>
        )}
      </div>

      {error && <p className="text-center text-red-600 py-10">{error}</p>}
      {!error && signs.length === 0 && <p className="text-center text-gray-500 py-10 print:hidden">Preparing signs…</p>}

      <div className="py-6 print:py-0 flex flex-col items-center gap-6 print:gap-0">
        {shown.map((s) => (
          <SignPage key={s.key} sign={s} event={event} color={color} size={size} boothCount={boothCount} />
        ))}
      </div>
    </div>
  )
}

function SignPage({ sign, event, color, size, boothCount }: { sign: Sign; event: any; color: string; size: 'A4' | 'A5'; boothCount: number }) {
  const onColor = contrastText(color)
  const a5 = size === 'A5'
  const steps = sign.kind === 'register' ? ['Scan the code', 'Create your passport', 'Visit every booth'] : ['Scan with your phone camera', sign.subtitle, 'Climb the leaderboard']
  return (
    <section
      className="bg-white text-[#16123D] shadow-xl print:shadow-none overflow-hidden flex flex-col font-poppins"
      style={{ width: a5 ? '148mm' : '210mm', height: a5 ? '210mm' : '297mm', breakAfter: 'page', pageBreakAfter: 'always' }}
    >
      {/* Event header */}
      {event?.bannerImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.bannerImage} alt="" className="w-full object-cover" style={{ aspectRatio: '8 / 3' }} />
      ) : (
        <div className="px-[8%] py-[5%]" style={{ backgroundColor: color, color: onColor }}>
          <p className={`font-oswald font-bold ${a5 ? 'text-2xl' : 'text-4xl'}`}>{event?.name}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center text-center px-[8%] pt-[5%] pb-[4%]">
        {event?.bannerImage && <p className={`font-semibold text-gray-500 ${a5 ? 'text-xs' : 'text-sm'}`}>{event?.name}</p>}
        <p className={`font-bold tracking-[0.25em] mt-1 ${a5 ? 'text-[10px]' : 'text-sm'}`} style={{ color }}>
          {sign.kind === 'register' ? 'START HERE' : `BOOTH ${sign.number}`}
        </p>
        {/* Headings are white in the dark admin theme, so the sign sets its own colour */}
        <h1 className={`font-oswald font-bold leading-tight mt-1 text-[#16123D] ${a5 ? 'text-3xl' : 'text-6xl'}`}>{sign.title}</h1>
        {sign.points !== undefined ? (
          <p className={`font-semibold mt-2 text-[#16123D] ${a5 ? 'text-lg' : 'text-3xl'}`}>
            Scan to earn{' '}
            <span className="px-3 py-0.5 rounded-full" style={{ backgroundColor: color, color: onColor }}>
              {sign.points} points
            </span>
          </p>
        ) : (
          <p className={`text-gray-600 mt-2 ${a5 ? 'text-sm' : 'text-xl'}`}>{sign.subtitle}</p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sign.qr} alt="" className="my-auto" style={{ width: a5 ? '78mm' : '118mm', height: a5 ? '78mm' : '118mm' }} />

        <ol className={`grid grid-cols-3 gap-3 w-full ${a5 ? 'text-[10px]' : 'text-base'}`}>
          {steps.map((step, i) => (
            <li key={step} className="flex flex-col items-center gap-1">
              <span className={`rounded-full font-bold flex items-center justify-center ${a5 ? 'w-6 h-6 text-xs' : 'w-9 h-9 text-lg'}`} style={{ backgroundColor: color, color: onColor }}>
                {i + 1}
              </span>
              <span className="font-semibold leading-tight">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={`border-t border-gray-200 px-[8%] py-[2.5%] flex justify-between items-center gap-3 text-gray-500 ${a5 ? 'text-[9px]' : 'text-xs'}`}>
        <span className="truncate">Can&apos;t scan? Open {sign.url.replace(/^https?:\/\//, '')}</span>
        {boothCount > 0 && <span className="whitespace-nowrap font-semibold" style={{ color }}>{boothCount} booths · top players win</span>}
      </div>
    </section>
  )
}
