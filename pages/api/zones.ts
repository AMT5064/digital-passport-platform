import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const { eventId } = req.query

      const zones = await prisma.zone.findMany({
        where: {
          ...(eventId && { eventId: eventId as string }),
        },
        include: {
          activity: true,
          _count: {
            select: { scans: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(zones)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { eventId, name, description, qrSlug, points } = req.body

      if (!eventId || !name || !qrSlug) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const zone = await prisma.zone.create({
        data: {
          eventId,
          name,
          description: description || '',
          qrSlug,
          points: points || 10,
          active: true,
        },
      })

      return res.status(201).json(zone)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, description, points, active } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Zone ID required' })
      }

      const zone = await prisma.zone.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(points !== undefined && { points }),
          ...(active !== undefined && { active }),
        },
      })

      return res.status(200).json(zone)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Zone ID required' })
      }

      await prisma.zone.delete({
        where: { id },
      })

      return res.status(200).json({ message: 'Zone deleted' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
