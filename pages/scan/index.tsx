import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, QrCode, Keyboard } from 'lucide-react'

export default function ScanIndexPage() {
  const { status } = useSession()
  const router = useRouter()
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState('')
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated' || !containerRef.current) return

    let cancelled = false

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled) return
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      scanner.render(
        (decodedText: string) => {
          const slug = extractSlug(decodedText)
          scanner.clear().catch(() => {})
          router.push(`/scan/${slug}`)
        },
        () => {}
      )
      scannerRef.current = scanner
    })

    return () => {
      cancelled = true
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [status, router])

  const extractSlug = (text: string) => {
    try {
      const url = new URL(text)
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[parts.length - 1]
    } catch {
      return text.trim()
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      setError('Enter a zone code first')
      return
    }
    router.push(`/scan/${extractSlug(manualCode.trim())}`)
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/passport">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#00CBB3]" />
            <h1 className="text-lg font-oswald font-bold">Scan Zone QR Code</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl overflow-hidden">
          <div id="qr-reader" ref={containerRef} />
        </div>
        <p className="text-center text-sm text-gray-400">
          Point your camera at a zone&apos;s QR code to check in
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleManualSubmit} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Keyboard className="w-4 h-4 text-[#00CBB3]" />
            Enter zone code manually
          </label>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value); setError('') }}
              placeholder="e.g. main_hall"
              className="flex-1 px-4 py-2.5 bg-[#16123D]/60 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
