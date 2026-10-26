import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await requireAdmin(req, res)
  if (!session) return

  if (req.method === 'GET') {
    try {
      const { eventId, search } = req.query
      if (eventId && !ensureEventAccess(session, res, eventId as string)) return

      const users = await prisma.user.findMany({
        where: {
          ...(eventId ? { eventId: eventId as string } : !session.isSuper && { eventId: { in: session.eventIds } }),
          ...(search && {
            OR: [
              { email: { contains: search as string, mode: 'insensitive' } },
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          scans: {
            select: { id: true, zoneId: true, pointsEarned: true, createdAt: true },
          },
          badges: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: eventId ? 5000 : 200,
      })

      return res.status(200).json(users)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, firstName, lastName, mobile, company, designation } = req.body

      if (!id) {
        return res.status(400).json({ error: 'User ID required' })
      }
      const existing = await prisma.user.findUnique({ where: { id }, select: { eventId: true } })
      if (!ensureEventAccess(session, res, existing?.eventId)) return

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(mobile !== undefined && { mobile }),
          ...(company !== undefined && { company }),
          ...(designation !== undefined && { designation }),
        },
      })

      return res.status(200).json(user)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'User ID required' })
      }
      const existing = await prisma.user.findUnique({ where: { id }, select: { eventId: true } })
      if (!ensureEventAccess(session, res, existing?.eventId)) return

      await prisma.user.delete({
        where: { id },
      })

      return res.status(200).json({ message: 'User deleted' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
