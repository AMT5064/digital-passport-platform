import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getEventStats } from '@/lib/eventStats'

// Attendee leaderboard: the top players, plus the signed-in attendee's own row wherever they are
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { eventId } = req.query
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID required' })
  }

  try {
    const [stats, session] = await Promise.all([getEventStats(eventId), getServerSession(req, res, authOptions)])
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    const zoneTotal = stats.zones.length
    const players = stats.leaderboard.filter((p) => p.zonesCompleted > 0)
    const row = (p: (typeof players)[number], i: number) => ({
      rank: i + 1,
      userName: p.name,
      company: p.company,
      points: p.points,
      zonesCompleted: p.zonesCompleted,
      finished: zoneTotal > 0 && p.zonesCompleted >= zoneTotal,
      isMe: p.userId === session?.user?.id,
    })
    const ranked = players.map(row)
    const me = ranked.find((p) => p.isMe) || null

    return res.status(200).json({
      success: true,
      data: {
        event: { id: stats.event.id, name: stats.event.name, themeColor: stats.event.themeColor, bannerImage: stats.event.bannerImage },
        zoneTotal,
        players: ranked.length,
        finishers: stats.totals.completedAll,
        top: ranked.slice(0, 50),
        me,
      },
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
