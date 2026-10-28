import QRCode from 'qrcode'

// QR codes must point at the public site even when an admin prints them from elsewhere.
// Set NEXT_PUBLIC_APP_URL to pin it; otherwise the current site is used.
export function appOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export const isLocalOrigin = (origin: string) => /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(origin)

export const boothUrl = (slug: string) => `${appOrigin()}/scan/${slug}`
export const registerUrl = (eventId: string) => `${appOrigin()}/register?event=${eventId}`

// High error correction keeps codes scannable on glossy, creased or partly covered prints
export const qrDataUrl = (text: string, size = 512) =>
  QRCode.toDataURL(text, { width: size, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#16123D', light: '#FFFFFF' } })

export const fileSafe = (text: string) => text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()

export async function downloadQr(text: string, fileName: string) {
  const url = await qrDataUrl(text, 1024)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileSafe(fileName)}-qr.png`
  a.click()
}
