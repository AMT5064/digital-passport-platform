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
  if (session.user.role !== 'SUPER_ADMIN') {
    const admin = await prisma.admin.findFirst({
      where: { id: session.user.id, eventId },
    })

    if (!admin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    }
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        where: { eventId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          company: true,
          designation: true,
          createdAt: true,
          scans: {
            select: { id: true, pointsEarned: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const data = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        mobile: u.mobile,
        company: u.company,
        designation: u.designation,
        joinedDate: u.createdAt,
        totalScans: u.scans.length,
        totalPoints: u.scans.reduce((sum, s) => sum + s.pointsEarned, 0),
      }))

      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error('Participants error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
