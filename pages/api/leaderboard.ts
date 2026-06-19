import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ApiResponse, PaginatedResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<PaginatedResponse<any>>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { eventId, page = '1', pageSize = '50' } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Event ID required',
      })
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const size = Math.min(100, parseInt(pageSize as string) || 50)
    const skip = (pageNum - 1) * size

    const [entries, total] = await Promise.all([
      prisma.leaderboard.findMany({
        where: { eventId },
        orderBy: { points: 'desc' },
        skip,
        take: size,
        include: {
          event: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.leaderboard.count({
        where: { eventId },
      }),
    ])

    // Fetch user details for each entry
    const leaderboardData = await Promise.all(
      entries.map(async (entry, index) => {
        const user = await prisma.user.findUnique({
          where: { id: entry.userId },
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        })

        return {
          rank: skip + index + 1,
          userId: entry.userId,
          userName: `${user?.firstName} ${user?.lastName}`,
          userAvatar: user?.avatar,
          points: entry.points,
          zonesCompleted: entry.zonesCompleted,
          activitiesCompleted: entry.activitiesCompleted,
        }
      })
    )

    const totalPages = Math.ceil(total / size)

    return res.status(200).json({
      success: true,
      data: {
        data: leaderboardData,
        total,
        page: pageNum,
        pageSize: size,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}
