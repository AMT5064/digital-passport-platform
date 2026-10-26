import type { NextApiRequest, NextApiResponse } from 'next'
import { getEventStats } from '@/lib/eventStats'

// Public feed for the projector leaderboard. Names and companies only: no emails or ids.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { eventId } = req.query
  if (typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Invalid event' })
  }

  try {
    const stats = await getEventStats(eventId)
    if (!stats) {
      return res.status(404).json({ error: 'Event not found' })
    }
    const zoneTotal = stats.zones.length
    const players = stats.leaderboard.filter((p) => p.zonesCompleted > 0)

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      event: stats.event,
      zones: stats.zones.map(({ id, name, points }) => ({ id, name, points })),
      totals: stats.totals,
      leaderboard: players.slice(0, 50).map((p) => ({
        rank: p.rank,
        name: p.name,
        company: p.company,
        points: p.points,
        zonesCompleted: p.zonesCompleted,
        zonePoints: p.zonePoints,
        finished: zoneTotal > 0 && p.zonesCompleted >= zoneTotal,
      })),
      // People who have started but still have booths to go, for the encouragement panel
      inProgress: players
        .filter((p) => p.zonesCompleted < zoneTotal)
        .slice(0, 8)
        .map((p) => ({ name: p.name, zonesLeft: zoneTotal - p.zonesCompleted, points: p.points })),
      recent: stats.recent.slice(0, 10),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Screen feed error:', error)
    return res.status(500).json({ error: 'Failed to load leaderboard' })
  }
}
