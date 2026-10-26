import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { MAX_ASSET_BYTES } from '@/lib/upload'

// Files arrive as base64 JSON, which is about a third larger than the file itself
export const config = {
  api: { bodyParser: { sizeLimit: '14mb' } },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!(await requireAdmin(req, res))) return

  try {
    const { name, mimeType, data } = req.body || {}
    if (!name || !mimeType || typeof data !== 'string') {
      return res.status(400).json({ error: 'name, mimeType and data are required' })
    }

    const bytes = Buffer.from(data, 'base64')
    if (bytes.length === 0) {
      return res.status(400).json({ error: 'The file is empty' })
    }
    if (bytes.length > MAX_ASSET_BYTES) {
      return res.status(413).json({ error: 'Files must be 10 MB or smaller' })
    }

    const asset = await prisma.asset.create({
      data: { name: String(name).slice(0, 200), mimeType: String(mimeType).slice(0, 100), size: bytes.length, data: bytes },
      select: { id: true, name: true, mimeType: true, size: true },
    })

    return res.status(201).json({ ...asset, url: `/api/assets/${asset.id}` })
  } catch (error: any) {
    console.error('Asset upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
