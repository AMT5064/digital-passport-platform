import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const session = await getSession({ req })

  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }

  const { eventId } = req.query

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID required' })
  }

  // Verify admin access
  const admin = await prisma.admin.findFirst({
    where: { id: session.user.id, eventId },
  })

  if (!admin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const zones = await prisma.zone.findMany({
        where: { eventId },
        include: { activity: true },
      })

      return res.status(200).json({
        success: true,
        data: zones,
      })
    } catch (error) {
      console.error('Get zones error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, image, points } = req.body

      if (!name) {
        return res.status(400).json({ success: false, error: 'Zone name required' })
      }

      // Generate unique QR slug
      const baseSlug = name.toLowerCase().replace(/\s+/g, '-')
      let qrSlug = baseSlug
      let counter = 1

      while (await prisma.zone.findUnique({ where: { qrSlug } })) {
        qrSlug = `${baseSlug}-${counter}`
        counter++
      }

      const zone = await prisma.zone.create({
        data: {
          name,
          description,
          image,
          qrSlug,
          eventId,
          points: points || 10,
        },
      })

      return res.status(201).json({
        success: true,
        data: zone,
      })
    } catch (error) {
      console.error('Create zone error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
