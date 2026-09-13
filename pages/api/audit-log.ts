import { prisma } from '@/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { action, entityType, entityId, entityName, campaignId, changes, userId } = req.body

      const log = await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          entityName,
          campaignId,
          changes: changes || {},
          userId: userId || 'system',
        },
      })

      return res.status(201).json(log)
    }

    if (req.method === 'GET') {
      const { campaignId, entityType, limit = 50 } = req.query

      const logs = await prisma.auditLog.findMany({
        where: {
          ...(campaignId && { campaignId: campaignId as string }),
          ...(entityType && { entityType: entityType as string }),
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
      })

      return res.status(200).json(logs)
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Audit log error:', error)
    res.status(500).json({ error: error.message })
  }
}
