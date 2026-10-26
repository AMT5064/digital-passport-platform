import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  try {
    if (req.method === 'POST') {
      const { action, entityType, entityId, entityName, campaignId, changes } = req.body
      if (campaignId && !ensureEventAccess(ctx, res, campaignId)) return

      const log = await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          entityName,
          campaignId,
          changes: changes || {},
          // Always the signed-in admin, never a value from the request
          userId: ctx.user.id,
        },
      })

      return res.status(201).json(log)
    }

    if (req.method === 'GET') {
      const { campaignId, entityType, limit = 50 } = req.query
      if (campaignId ? !ensureEventAccess(ctx, res, campaignId as string) : !ctx.isSuper && !ensureEventAccess(ctx, res, null)) return

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
