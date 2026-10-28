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
      const { eventId } = req.query
      if (eventId && !ensureEventAccess(session, res, eventId as string)) return

      const zones = await prisma.zone.findMany({
        where: eventId ? { eventId: eventId as string } : session.isSuper ? {} : { eventId: { in: session.eventIds } },
        include: {
          activities: true,
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

      if (!eventId || !name?.trim()) {
        return res.status(400).json({ error: 'Booth name is required' })
      }
      if (!ensureEventAccess(session, res, eventId)) return

      // The QR code ID is optional: it's made from the booth name plus a short random tail
      const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
      let slug = qrSlug ? clean(String(qrSlug)) : ''
      if (slug && (await prisma.zone.findUnique({ where: { qrSlug: slug }, select: { id: true } }))) {
        return res.status(409).json({ error: `The QR code ID "${slug}" is already used by another booth` })
      }
      for (let i = 0; !slug && i < 5; i++) {
        const candidate = `${clean(name) || 'booth'}-${Math.random().toString(36).slice(2, 6)}`
        if (!(await prisma.zone.findUnique({ where: { qrSlug: candidate }, select: { id: true } }))) slug = candidate
      }

      const zone = await prisma.zone.create({
        data: {
          eventId,
          name: name.trim(),
          description: description || '',
          qrSlug: slug,
          points: Number.isFinite(Number(points)) ? Math.max(0, Number(points)) : 10,
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
      const existing = await prisma.zone.findUnique({ where: { id }, select: { eventId: true } })
      if (!ensureEventAccess(session, res, existing?.eventId)) return

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
      const existing = await prisma.zone.findUnique({ where: { id }, select: { eventId: true } })
      if (!ensureEventAccess(session, res, existing?.eventId)) return

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
