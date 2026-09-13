import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        scans: true,
        badges: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const totalPoints = user.scans.reduce((sum, scan) => sum + scan.pointsEarned, 0)
    const zonesCompleted = new Set(user.scans.map((s) => s.zoneId)).size

    let zonesTotal = 0
    let currentRank: number | null = null

    if (user.eventId) {
      zonesTotal = await prisma.zone.count({ where: { eventId: user.eventId } })

      const rankedUsers = await prisma.leaderboard.findMany({
        where: { eventId: user.eventId },
        orderBy: { points: 'desc' },
        select: { userId: true },
      })
      const idx = rankedUsers.findIndex((r) => r.userId === user.id)
      currentRank = idx >= 0 ? idx + 1 : null
    }

    return res.status(200).json({
      user: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email },
      totalPoints,
      currentRank,
      zonesCompleted,
      zonesTotal,
      badges: user.badges,
    })
  } catch (error: any) {
    console.error('Passport stats error:', error)
    return res.status(500).json({ error: error.message })
  }
}
