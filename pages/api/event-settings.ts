import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'

const SCAN_MODES = ['ONE_SCAN', 'DAILY', 'UNLIMITED']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  const eventId = (req.method === 'GET' ? req.query.eventId : req.body?.eventId) as string | undefined
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' })
  }
  if (!ensureEventAccess(ctx, res, eventId)) return

  try {
    if (req.method === 'GET') {
      const settings = await prisma.eventSettings.findUnique({ where: { eventId } })
      return res.status(200).json(settings)
    }

    if (req.method === 'PUT') {
      const { scanMode, enableNotifications, enableLeaderboard } = req.body
      if (scanMode && !SCAN_MODES.includes(scanMode)) {
        return res.status(400).json({ error: 'Invalid scan mode' })
      }

      const data = {
        ...(scanMode && { scanMode }),
        ...(typeof enableNotifications === 'boolean' && { enableNotifications }),
        ...(typeof enableLeaderboard === 'boolean' && { enableLeaderboard }),
      }
      const settings = await prisma.eventSettings.upsert({
        where: { eventId },
        update: data,
        create: { eventId, ...data },
      })
      return res.status(200).json(settings)
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Event settings error:', error)
    res.status(500).json({ error: error.message })
  }
}
