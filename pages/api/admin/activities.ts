import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'
import { ActivityType } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const session = await getSession({ req })

  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }

  const { eventId, zoneId } = req.query

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
      const activities = await prisma.activity.findMany({
        where: { eventId },
      })

      return res.status(200).json({
        success: true,
        data: activities,
      })
    } catch (error) {
      console.error('Get activities error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { type, zoneId: reqZoneId, data } = req.body

      if (!type || !reqZoneId) {
        return res.status(400).json({
          success: false,
          error: 'Activity type and zone ID required',
        })
      }

      // Check if activity already exists for this zone
      const existingActivity = await prisma.activity.findUnique({
        where: { zoneId: reqZoneId },
      })

      if (existingActivity) {
        // Update existing activity
        const updatedActivity = await prisma.activity.update({
          where: { zoneId: reqZoneId },
          data: {
            type: type as ActivityType,
            question: data?.question,
            answers: data?.answers,
            pollOptions: data?.pollOptions,
            surveyQuestions: data?.surveyQuestions,
            downloadUrl: data?.downloadUrl,
            downloadName: data?.downloadName,
            videoUrl: data?.videoUrl,
            videoDuration: data?.videoDuration,
            ctaButtonText: data?.ctaButtonText,
            ctaUrl: data?.ctaUrl,
          },
        })

        return res.status(200).json({
          success: true,
          data: updatedActivity,
        })
      }

      // Create new activity
      const activity = await prisma.activity.create({
        data: {
          type: type as ActivityType,
          zoneId: reqZoneId,
          eventId,
          question: data?.question,
          answers: data?.answers,
          pollOptions: data?.pollOptions,
          surveyQuestions: data?.surveyQuestions,
          downloadUrl: data?.downloadUrl,
          downloadName: data?.downloadName,
          videoUrl: data?.videoUrl,
          videoDuration: data?.videoDuration,
          ctaButtonText: data?.ctaButtonText,
          ctaUrl: data?.ctaUrl,
        },
      })

      return res.status(201).json({
        success: true,
        data: activity,
      })
    } catch (error) {
      console.error('Create activity error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
