import type { NextApiRequest, NextApiResponse } from 'next'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'
import { getActivityResults, getEventStats } from '@/lib/eventStats'

// Campaign analytics: rankings, funnel, booth traffic and what attendees answered
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  const eventId = req.query.eventId
  if (typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID required' })
  }
  if (!ensureEventAccess(ctx, res, eventId)) return

  try {
    const [stats, activity] = await Promise.all([getEventStats(eventId), getActivityResults(eventId)])
    if (!stats) {
      return res.status(404).json({ error: 'Event not found' })
    }
    return res.status(200).json({ ...stats, activityResults: activity.results, responses: activity.responses.slice(-200).reverse() })
  } catch (error) {
    console.error('Event stats error:', error)
    return res.status(500).json({ error: 'Failed to load analytics' })
  }
}
