import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await requireAdmin(req, res)
  if (!session) return

  if (req.method === 'GET') {
    try {
      const { eventId, id } = req.query

      if (id) {
        const activity = await prisma.activity.findUnique({
          where: { id: id as string },
          include: { zone: true },
        })
        if (!activity) {
          return res.status(404).json({ error: 'Activity not found' })
        }
        if (!ensureEventAccess(session, res, activity.eventId)) return
        return res.status(200).json(activity)
      }

      if (eventId && !ensureEventAccess(session, res, eventId as string)) return
      const activities = await prisma.activity.findMany({
        where: eventId ? { eventId: eventId as string } : session.isSuper ? {} : { eventId: { in: session.eventIds } },
        include: {
          zone: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(activities)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        eventId, zoneId, type, title, description,
        question, answers, pollOptions, surveyQuestions,
        downloadUrl, downloadName, videoUrl, videoDuration,
        raffleName, rafflePrize, ctaButtonText, ctaUrl, settings,
      } = req.body

      if (!eventId || !zoneId || !type || !title) {
        return res.status(400).json({ error: 'Zone, type, and title are required' })
      }
      if (!ensureEventAccess(session, res, eventId)) return
      // The zone must belong to the same event
      const zone = await prisma.zone.findUnique({ where: { id: zoneId }, select: { eventId: true } })
      if (zone?.eventId !== eventId) {
        return res.status(400).json({ error: 'That zone is not part of this event' })
      }

      const activity = await prisma.activity.create({
        data: {
          eventId,
          zoneId,
          type,
          title,
          description: description || '',
          ...(question !== undefined && { question }),
          ...(answers && { answers }),
          ...(pollOptions && { pollOptions }),
          ...(surveyQuestions && { surveyQuestions }),
          ...(downloadUrl !== undefined && { downloadUrl }),
          ...(downloadName !== undefined && { downloadName }),
          ...(videoUrl !== undefined && { videoUrl }),
          ...(videoDuration !== undefined && { videoDuration: videoDuration ? parseInt(videoDuration) : null }),
          ...(raffleName !== undefined && { raffleName }),
          ...(rafflePrize !== undefined && { rafflePrize }),
          ...(ctaButtonText !== undefined && { ctaButtonText }),
          ...(ctaUrl !== undefined && { ctaUrl }),
          ...(settings !== undefined && { settings }),
        },
      })

      return res.status(201).json(activity)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        id, zoneId, type, title, description,
        question, answers, pollOptions, surveyQuestions,
        downloadUrl, downloadName, videoUrl, videoDuration,
        raffleName, rafflePrize, ctaButtonText, ctaUrl, settings,
      } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Activity ID required' })
      }
      const existing = await prisma.activity.findUnique({ where: { id }, select: { eventId: true } })
      if (!ensureEventAccess(session, res, existing?.eventId)) return
      if (zoneId) {
        const zone = await prisma.zone.findUnique({ where: { id: zoneId }, select: { eventId: true } })
        if (zone?.eventId !== existing?.eventId) {
          return res.status(400).json({ error: 'That zone is not part of this event' })
        }
      }

      const activity = await prisma.activity.update({
        where: { id },
        data: {
          ...(zoneId && { zoneId }),
          ...(type && { type }),
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(question !== undefined && { question }),
          ...(answers !== undefined && { answers }),
          ...(pollOptions !== undefined && { pollOptions }),
          ...(surveyQuestions !== undefined && { surveyQuestions }),
          ...(downloadUrl !== undefined && { downloadUrl }),
          ...(downloadName !== undefined && { downloadName }),
          ...(videoUrl !== undefined && { videoUrl }),
          ...(videoDuration !== undefined && { videoDuration: videoDuration ? parseInt(videoDuration) : null }),
          ...(raffleName !== undefined && { raffleName }),
          ...(rafflePrize !== undefined && { rafflePrize }),
          ...(ctaButtonText !== undefined && { ctaButtonText }),
          ...(ctaUrl !== undefined && { ctaUrl }),
          ...(settings !== undefined && { settings }),
        },
      })

      return res.status(200).json(activity)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Activity ID required' })
      }
      const existing = await prisma.activity.findUnique({ where: { id }, select: { eventId: true } })
      if (!ensureEventAccess(session, res, existing?.eventId)) return

      await prisma.activity.delete({
        where: { id },
      })

      return res.status(200).json({ message: 'Activity deleted' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
