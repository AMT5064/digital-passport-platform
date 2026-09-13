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
      const [events, zones, participants, scans, leaderboard] = await Promise.all([
        prisma.event.count(),
        prisma.zone.count(),
        prisma.user.count(),
        prisma.scan.count(),
        prisma.leaderboard.findMany({
          orderBy: { points: 'desc' },
          take: 10,
          include: {
            event: true,
          },
        }),
      ])

      // Get today's scans
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrowStart = new Date(today)
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)

      const todaysScans = await prisma.scan.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrowStart,
          },
        },
      })

      return res.status(200).json({
        totalEvents: events,
        totalZones: zones,
        totalParticipants: participants,
        totalScans: scans,
        todaysScans,
        topLeaderboard: leaderboard,
      })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
