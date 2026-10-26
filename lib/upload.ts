export const MAX_ASSET_BYTES = 10 * 1024 * 1024

export interface UploadedFile {
  url: string
  name: string
  size: number
  mimeType: string
}

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })

// Uploads a file to /api/assets and returns where it is served from
export async function uploadFile(file: File): Promise<UploadedFile> {
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error('Files must be 10 MB or smaller')
  }
  const response = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType: file.type || 'application/octet-stream', data: await readAsBase64(file) }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error || 'Upload failed')
  }
  return { url: body.url, name: body.name, size: body.size, mimeType: body.mimeType }
}

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
