import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { slug } = req.query
    const session = await getServerSession(req, res, authOptions)

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid zone slug',
      })
    }

    const zone = await prisma.zone.findUnique({
      where: { qrSlug: slug },
      include: { activities: { orderBy: { createdAt: 'asc' } }, event: true },
    })

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found',
      })
    }

    // If GET request, return zone and activity info
    if (req.method === 'GET') {
      // Let a returning attendee see they've already done this booth before answering again
      const previousScan = session?.user
        ? await prisma.scan.findUnique({
            where: {
              userId_zoneId_eventId: { userId: session.user.id, zoneId: zone.id, eventId: zone.eventId },
            },
            select: { pointsEarned: true, completedAt: true },
          })
        : null

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
          activities: zone.activities,
          event: {
            id: zone.event.id,
            name: zone.event.name,
            themeColor: zone.event.themeColor,
            bannerImage: zone.event.bannerImage,
            logo: zone.event.logo,
          },
          completion: previousScan,
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

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Registration doesn't ask which event the attendee is joining, so
    // associate them with the event of the first zone they scan.
    if (!user.eventId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { eventId: zone.eventId },
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

    // The schema allows one scan per user per zone, so a repeat completion
    // would otherwise fail with a database error.
    const alreadyCompleted = await prisma.scan.findUnique({
      where: {
        userId_zoneId_eventId: { userId: user.id, zoneId: zone.id, eventId: zone.eventId },
      },
    })
    if (alreadyCompleted) {
      return res.status(409).json({ success: false, error: 'You have already completed this zone' })
    }

    const activity = zone.activities[0]
    const settings = ((activity?.settings as any) || {}) as Record<string, any>
    const toList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : [])

    // Enforce required answers on the server as well as in the browser
    if (activity?.type === 'QUIZ' && toList(activityData?.quizAnswer).length === 0) {
      return res.status(400).json({ success: false, error: 'Please select an answer' })
    }
    if (activity?.type === 'POLL' && toList(activityData?.pollAnswer).length === 0) {
      return res.status(400).json({ success: false, error: 'Please select an option' })
    }
    if (activity?.type === 'SURVEY') {
      const answers = (activityData?.surveyAnswers || {}) as Record<string, unknown>
      const missing = ((activity.surveyQuestions as any[]) || []).some(
        (q) => typeof q === 'object' && q.required !== false && toList(answers[q.id]).length === 0
      )
      if (missing) {
        return res.status(400).json({ success: false, error: 'Please answer all required questions' })
      }
    }

    // Grade the quiz: the selection must match the set of correct answers exactly.
    // Wrong answers earn no points.
    let isCorrect: boolean | null = null
    let correctAnswerText: string | null = null
    let pointsEarned = zone.points

    if (activity?.type === 'QUIZ') {
      const answers = (activity.answers as any[]) || []
      const correct = answers.filter((a) => a.isCorrect)
      const given = toList(activityData?.quizAnswer)
      correctAnswerText = correct.map((a) => a.text).join(', ') || null
      isCorrect =
        correct.length > 0 &&
        given.length === correct.length &&
        correct.every((a) => given.includes(String(a.id)))
      if (!isCorrect) {
        pointsEarned = 0
      }
    }

    // Record the scan
    const scan = await prisma.scan.create({
      data: {
        userId: user.id,
        zoneId: zone.id,
        eventId: zone.eventId,
        pointsEarned,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        device: req.body.device || 'Unknown',
        browser: req.body.browser || 'Unknown',
        ipAddress: req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
      },
    })

    // Award points
    if (pointsEarned > 0) {
      await prisma.pointsTransaction.create({
        data: {
          userId: user.id,
          eventId: zone.eventId,
          points: pointsEarned,
          reason: `Scanned ${zone.name}`,
          metadata: { zoneId: zone.id, scanId: scan.id },
        },
      })
    }

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
        // Each scan completes that zone's activity
        activitiesCompleted: scanCount,
      },
      create: {
        eventId: zone.eventId,
        userId: user.id,
        rank: 1,
        points: totalPoints._sum.points || 0,
        zonesCompleted: scanCount,
        activitiesCompleted: scanCount,
      },
    })

    // Poll results: tally every vote recorded for this zone's poll
    let pollResults: { total: number; options: { id: string; text: string; count: number; percent: number }[] } | null = null
    if (activity?.type === 'POLL' && settings.showResults !== false) {
      const logs = await prisma.activityLog.findMany({
        where: { zoneId: zone.id, eventId: zone.eventId, action: 'ZONE_SCANNED' },
        select: { details: true },
        take: 5000,
      })
      const counts: Record<string, number> = {}
      let voters = 0
      for (const log of logs) {
        const data = (log.details as any)?.activityData
        if (data?.type !== 'POLL') continue
        const picks = toList(data.pollAnswer)
        if (picks.length === 0) continue
        voters++
        picks.forEach((id) => {
          counts[id] = (counts[id] || 0) + 1
        })
      }
      pollResults = {
        total: voters,
        options: ((activity.pollOptions as any[]) || []).map((o) => ({
          id: o.id,
          text: o.text,
          count: counts[o.id] || 0,
          percent: voters ? Math.round(((counts[o.id] || 0) / voters) * 100) : 0,
        })),
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        scan: {
          id: scan.id,
          pointsEarned: scan.pointsEarned,
          completedAt: scan.completedAt,
        },
        totalPoints: totalPoints._sum.points || 0,
        isCorrect,
        correctAnswerText,
        explanation: activity?.type === 'QUIZ' ? settings.explanation || null : null,
        pollResults,
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
