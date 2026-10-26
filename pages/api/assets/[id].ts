import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Images are shown in the page; everything else is downloaded with its original file name
const INLINE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid asset id' })
  }

  try {
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) {
      return res.status(404).json({ error: 'File not found' })
    }

    const inline = INLINE_TYPES.includes(asset.mimeType)
    const fileName = encodeURIComponent(asset.name)
    res.setHeader('Content-Type', inline ? asset.mimeType : asset.mimeType || 'application/octet-stream')
    res.setHeader('Content-Length', asset.size)
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${fileName}`)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    // Assets never change once uploaded (a new upload gets a new id)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.status(200).send(Buffer.from(asset.data))
  } catch (error) {
    console.error('Asset fetch error:', error)
    return res.status(500).json({ error: 'Failed to load file' })
  }
}
