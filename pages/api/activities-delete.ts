import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  try {
    if (req.method === 'DELETE') {
      const { id } = req.query
      const existing = await prisma.activity.findUnique({ where: { id: id as string }, select: { eventId: true } })
      if (!ensureEventAccess(ctx, res, existing?.eventId)) return

      const activity = await prisma.activity.delete({
        where: { id: id as string },
      })

      return res.status(200).json({ success: true, deleted: activity })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Delete activity error:', error)
    res.status(500).json({ error: error.message })
  }
}
