import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'

// Clears an event's activity (scans, points, leaderboard, answers) and optionally its participants.
// Booths, activities, branding and settings are kept so the event can run again.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  const { eventId, confirmName, removeParticipants } = req.body || {}
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' })
  }
  if (!ensureEventAccess(ctx, res, eventId)) return

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    // Typing the event name guards against clearing the wrong event
    if (String(confirmName || '').trim() !== event.name) {
      return res.status(400).json({ error: 'Type the event name exactly to confirm' })
    }

    const removeUsers = removeParticipants === true
    const [scans, points, leaderboard, logs, users] = await prisma.$transaction([
      prisma.scan.deleteMany({ where: { eventId } }),
      prisma.pointsTransaction.deleteMany({ where: { eventId } }),
      prisma.leaderboard.deleteMany({ where: { eventId } }),
      prisma.activityLog.deleteMany({ where: { eventId } }),
      // An id that never matches keeps the transaction shape the same when participants stay
      prisma.user.deleteMany({ where: removeUsers ? { eventId, role: 'ATTENDEE' } : { id: { in: [] } } }),
    ])

    await prisma.auditLog.create({
      data: {
        action: 'RESET',
        entityType: 'EVENT',
        entityId: eventId,
        entityName: event.name,
        campaignId: eventId,
        userId: ctx.user.id,
        changes: { scans: scans.count, removedParticipants: users.count },
      },
    })

    return res.status(200).json({
      success: true,
      cleared: {
        scans: scans.count,
        points: points.count,
        leaderboard: leaderboard.count,
        answers: logs.count,
        participants: users.count,
      },
    })
  } catch (error) {
    console.error('Event reset error:', error)
    return res.status(500).json({ error: 'Failed to clear records' })
  }
}
