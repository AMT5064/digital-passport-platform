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

    const { eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Event ID required',
      })
    }

    // Verify admin access to this event
    const admin = await prisma.admin.findFirst({
      where: { id: session.user.id, eventId },
    })

    if (!admin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    // Get total participants
    const totalParticipants = await prisma.user.count({
      where: { eventId },
    })

    // Get unique visitors (unique users who have scanned)
    const uniqueVisitors = await prisma.scan.findMany({
      where: { eventId },
      distinct: ['userId'],
      select: { userId: true },
    })

    // Get zone statistics
    const zoneStats = await Promise.all(
      (
        await prisma.zone.findMany({ where: { eventId } })
      ).map(async (zone) => {
        const visits = await prisma.scan.count({
          where: { zoneId: zone.id },
        })

        const users = await prisma.scan.findMany({
          where: { zoneId: zone.id },
          distinct: ['userId'],
          select: { userId: true },
        })

        const pointsAwarded = await prisma.pointsTransaction.aggregate({
          where: {
            eventId,
            metadata: {
              path: ['zoneId'],
              equals: zone.id,
            },
          },
          _sum: { points: true },
        })

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          visits,
          completionRate: totalParticipants > 0 ? (users.length / totalParticipants) * 100 : 0,
          pointsAwarded: pointsAwarded._sum.points || 0,
        }
      })
    )

    // Get hourly traffic
    const scans = await prisma.scan.findMany({
      where: { eventId },
      select: { createdAt: true },
    })

    const hourlyTraffic: { [key: string]: { visits: number; completions: number } } = {}

    scans.forEach((scan) => {
      const hour = scan.createdAt.getHours()
      const key = `${hour}:00`

      if (!hourlyTraffic[key]) {
        hourlyTraffic[key] = { visits: 0, completions: 0 }
      }
      hourlyTraffic[key].visits++
      if (scan.completedAt) {
        hourlyTraffic[key].completions++
      }
    })

    // Get top zones by visits
    const topZones = zoneStats
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5)

    // Get activity stats
    const activities = await prisma.activity.findMany({
      where: { eventId },
      include: { zone: true },
    })

    const activityStats = activities.map((activity) => {
      const completions = zoneStats.find((z) => z.zoneId === activity.zoneId)?.visits || 0

      return {
        activityType: activity.type,
        zoneName: activity.zone.name,
        completions,
      }
    })

    // Get leaderboard distribution
    const leaderboardEntries = await prisma.leaderboard.findMany({
      where: { eventId },
      orderBy: { points: 'desc' },
    })

    const distribution = [0, 0, 0, 0, 0] // 0-20, 20-40, 40-60, 60-80, 80+
    leaderboardEntries.forEach((entry) => {
      if (entry.points < 20) distribution[0]++
      else if (entry.points < 40) distribution[1]++
      else if (entry.points < 60) distribution[2]++
      else if (entry.points < 80) distribution[3]++
      else distribution[4]++
    })

    return res.status(200).json({
      success: true,
      data: {
        totalParticipants,
        uniqueVisitors: uniqueVisitors.length,
        totalScans: scans.length,
        zoneStats,
        activityStats,
        hourlyTraffic: Object.entries(hourlyTraffic).map(([hour, data]) => ({
          hour,
          ...data,
        })),
        leaderboardDistribution: distribution,
        topZones,
        topActivities: activityStats.sort((a, b) => b.completions - a.completions).slice(0, 5),
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}
