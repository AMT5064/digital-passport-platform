import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'
import { getSession } from 'next-auth/react'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { slug } = req.query
    const session = await getSession({ req })

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid zone slug',
      })
    }

    const zone = await prisma.zone.findUnique({
      where: { qrSlug: slug },
      include: { activity: true, event: true },
    })

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found',
      })
    }

    // If GET request, return zone and activity info
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          zone: {
            id: zone.id,
            name: zone.name,
            description: zone.description,
            image: zone.image,
            points: zone.points,
          },
          activity: zone.activity,
          event: {
            id: zone.event.id,
            name: zone.event.name,
            themeColor: zone.event.themeColor,
          },
        },
      })
    }

    // POST: Record the scan and activity completion
    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      })
    }

    const { completedAt, activityData } = req.body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Check scan restrictions
    const eventSettings = await prisma.eventSettings.findUnique({
      where: { eventId: zone.eventId },
    })

    if (eventSettings?.scanMode === 'ONE_SCAN') {
      const existingScan = await prisma.scan.findUnique({
        where: {
          userId_zoneId_eventId: {
            userId: user.id,
            zoneId: zone.id,
            eventId: zone.eventId,
          },
        },
      })

      if (existingScan) {
        return res.status(409).json({
          success: false,
          error: 'You have already scanned this zone',
        })
      }
    } else if (eventSettings?.scanMode === 'DAILY') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayScan = await prisma.scan.findFirst({
        where: {
          userId: user.id,
          zoneId: zone.id,
          eventId: zone.eventId,
          createdAt: { gte: today },
        },
      })

      if (todayScan) {
        return res.status(409).json({
          success: false,
          error: 'You have already scanned this zone today',
        })
      }
    }

    // Record the scan
    const scan = await prisma.scan.create({
      data: {
        userId: user.id,
        zoneId: zone.id,
        eventId: zone.eventId,
        pointsEarned: zone.points,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        device: req.body.device || 'Unknown',
        browser: req.body.browser || 'Unknown',
        ipAddress: req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
      },
    })

    // Award points
    await prisma.pointsTransaction.create({
      data: {
        userId: user.id,
        eventId: zone.eventId,
        points: zone.points,
        reason: `Scanned ${zone.name}`,
        metadata: { zoneId: zone.id, scanId: scan.id },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        zoneId: zone.id,
        eventId: zone.eventId,
        action: 'ZONE_SCANNED',
        details: { activityData },
        device: req.body.device || 'Unknown',
        browser: req.body.browser || 'Unknown',
        ipAddress: req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
      },
    })

    // Update leaderboard
    const totalPoints = await prisma.pointsTransaction.aggregate({
      where: { userId: user.id, eventId: zone.eventId },
      _sum: { points: true },
    })

    const scanCount = await prisma.scan.count({
      where: { userId: user.id, eventId: zone.eventId },
    })

    await prisma.leaderboard.upsert({
      where: {
        eventId_userId: {
          eventId: zone.eventId,
          userId: user.id,
        },
      },
      update: {
        points: totalPoints._sum.points || 0,
        zonesCompleted: scanCount,
      },
      create: {
        eventId: zone.eventId,
        userId: user.id,
        rank: 1,
        points: totalPoints._sum.points || 0,
        zonesCompleted: scanCount,
        activitiesCompleted: 0,
      },
    })

    return res.status(200).json({
      success: true,
      data: {
        scan: {
          id: scan.id,
          pointsEarned: scan.pointsEarned,
          completedAt: scan.completedAt,
        },
        totalPoints: totalPoints._sum.points || 0,
      },
    })
  } catch (error) {
    console.error('Scan error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}
