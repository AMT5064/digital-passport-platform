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
      const { eventId } = req.query

      const activities = await prisma.activity.findMany({
        where: {
          ...(eventId && { eventId: eventId as string }),
        },
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
      const { eventId, zoneId, type, question, answers, pollOptions, surveyQuestions, ctaButtonText, ctaUrl } = req.body

      if (!eventId || !zoneId || !type) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const activity = await prisma.activity.create({
        data: {
          eventId,
          zoneId,
          type,
          question: question || '',
          ...(answers && { answers }),
          ...(pollOptions && { pollOptions }),
          ...(surveyQuestions && { surveyQuestions }),
          ...(ctaButtonText && { ctaButtonText }),
          ...(ctaUrl && { ctaUrl }),
        },
      })

      return res.status(201).json(activity)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, type, question, answers, pollOptions, surveyQuestions } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Activity ID required' })
      }

      const activity = await prisma.activity.update({
        where: { id },
        data: {
          ...(type && { type }),
          ...(question !== undefined && { question }),
          ...(answers && { answers }),
          ...(pollOptions && { pollOptions }),
          ...(surveyQuestions && { surveyQuestions }),
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
