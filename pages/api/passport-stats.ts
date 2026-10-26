import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventStats } from '@/lib/eventStats'

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
      include: { badges: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const base = {
      user: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email },
      badges: user.badges,
    }

    // Not linked to an event until registering through one or scanning a first booth
    const stats = user.eventId ? await getEventStats(user.eventId) : null
    if (!stats) {
      return res.status(200).json({ ...base, totalPoints: 0, currentRank: null, zonesCompleted: 0, zonesTotal: 0, event: null, zones: [], players: 0, nextTarget: null })
    }

    const me = stats.leaderboard.find((p) => p.userId === user.id)
    const players = stats.leaderboard.filter((p) => p.zonesCompleted > 0)
    const myIndex = me && me.zonesCompleted > 0 ? players.findIndex((p) => p.userId === user.id) : -1
    // Who to chase next: the person directly above, and how many points it takes to pass them
    const above = myIndex > 0 ? players[myIndex - 1] : null

    return res.status(200).json({
      ...base,
      totalPoints: me?.points || 0,
      currentRank: myIndex >= 0 ? myIndex + 1 : null,
      players: players.length,
      zonesCompleted: me?.zonesCompleted || 0,
      zonesTotal: stats.zones.length,
      event: {
        id: stats.event.id,
        name: stats.event.name,
        description: stats.event.description,
        venue: stats.event.venue,
        startDate: stats.event.startDate,
        endDate: stats.event.endDate,
        bannerImage: stats.event.bannerImage,
        themeColor: stats.event.themeColor,
      },
      zones: stats.zones.map((z) => ({
        id: z.id,
        name: z.name,
        points: z.points,
        activityType: z.activityType,
        completed: !!me && z.id in me.zonePoints,
        pointsEarned: me?.zonePoints[z.id] ?? null,
      })),
      nextTarget: above ? { rank: myIndex, name: above.name.split(' ')[0], pointsNeeded: above.points - (me?.points || 0) + 1 } : null,
    })
  } catch (error: any) {
    console.error('Passport stats error:', error)
    return res.status(500).json({ error: 'Failed to load your passport' })
  }
}
