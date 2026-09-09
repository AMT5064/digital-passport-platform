import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })
    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, eventId: true, firstName: true, lastName: true, email: true }
    })

    if (!user?.eventId) {
      return res.status(200).json({
        success: true,
        data: {
          totalPoints: 0,
          currentRank: 0,
          zonesCompleted: 0,
          zonesTotal: 0,
          badges: [],
          recentScans: [],
        },
      })
    }

    const [pointsAgg, scanCount, zonesTotal, leaderboard, badges, recentScans] =
      await Promise.all([
        prisma.pointsTransaction.aggregate({
          where: { userId: user.id, eventId: user.eventId },
          _sum: { points: true },
        }),
        prisma.scan.count({
          where: { userId: user.id, eventId: user.eventId },
        }),
        prisma.zone.count({
          where: { eventId: user.eventId, active: true },
        }),
        prisma.leaderboard.findMany({
          where: { eventId: user.eventId },
          orderBy: { points: 'desc' },
          select: { userId: true },
        }),
        prisma.badge.findMany({
          where: { eventId: user.eventId, users: { some: { id: user.id } } },
        }),
        prisma.scan.findMany({
          where: { userId: user.id, eventId: user.eventId },
          include: { zone: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])

    const rank = leaderboard.findIndex((e) => e.userId === user.id) + 1

    return res.status(200).json({
      success: true,
      data: {
        totalPoints: pointsAgg._sum.points || 0,
        currentRank: rank,
        zonesCompleted: scanCount,
        zonesTotal,
        badges: badges.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
        })),
        recentScans: recentScans.map((s) => ({
          id: s.id,
          zoneName: s.zone.name,
          points: s.pointsEarned,
          date: s.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
