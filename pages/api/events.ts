import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureEventAccess, ensureSuperAdmin, requireAdmin } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await requireAdmin(req, res)
  if (!session) return

  if (req.method === 'GET') {
    try {
      const events = await prisma.event.findMany({
        where: session.isSuper ? {} : { id: { in: session.eventIds } },
        include: {
          _count: {
            select: { attendees: true, zones: true, scans: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(events)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    if (!ensureSuperAdmin(session, res)) return
    try {
      const { name, description, startDate, endDate, venue, themeColor } = req.body

      if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const event = await prisma.event.create({
        data: {
          name,
          description: description || '',
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          venue: venue || '',
          themeColor: themeColor || '#3B82F6',
          status: 'DRAFT',
        },
      })

      return res.status(201).json(event)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, description, startDate, endDate, venue, status, themeColor, bannerImage, logo } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Event ID required' })
      }
      if (!ensureEventAccess(session, res, id)) return

      const event = await prisma.event.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(venue !== undefined && { venue }),
          ...(status && { status }),
          ...(themeColor && { themeColor }),
          // null clears an image, undefined leaves it alone
          ...(bannerImage !== undefined && { bannerImage }),
          ...(logo !== undefined && { logo }),
        },
      })

      return res.status(200).json(event)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'DELETE') {
    if (!ensureSuperAdmin(session, res)) return
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Event ID required' })
      }

      await prisma.event.delete({
        where: { id },
      })

      return res.status(200).json({ message: 'Event deleted' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
