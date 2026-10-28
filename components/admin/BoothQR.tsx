import React, { useEffect, useState } from 'react'
import { qrDataUrl } from '@/lib/qr'

// A booth's QR code drawn as an image, so it shows on the card and right-click save works too
export default function BoothQR({ value, size = 132, className = '' }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    qrDataUrl(value, Math.max(256, size * 2))
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(''))
    return () => {
      alive = false
    }
  }, [value, size])

  return (
    <div className={`bg-white rounded-lg p-1.5 flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`QR code for ${value}`} width={size - 12} height={size - 12} className="w-full h-full" />
      ) : (
        <div className="w-full h-full bg-gray-100 animate-pulse rounded" />
      )}
    </div>
  )
}
