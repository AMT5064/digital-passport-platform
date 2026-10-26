import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { getEventStats } from '@/lib/eventStats'

// Master dashboard: totals across every event this admin can see, plus a summary per event
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  try {
    const events = await prisma.event.findMany({
      where: ctx.isSuper ? {} : { id: { in: ctx.eventIds } },
      select: { id: true },
      orderBy: { startDate: 'desc' },
    })
    const stats = (await Promise.all(events.map((e) => getEventStats(e.id)))).filter(Boolean) as NonNullable<
      Awaited<ReturnType<typeof getEventStats>>
    >[]

    const now = Date.now()
    const summaries = stats.map((s) => {
      const start = new Date(s.event.startDate).getTime()
      const end = new Date(s.event.endDate).getTime() + 24 * 60 * 60 * 1000
      const phase = now < start ? 'UPCOMING' : now > end ? 'ENDED' : 'LIVE'
      return {
        ...s.event,
        phase,
        zones: s.zones.length,
        totals: s.totals,
        topThree: s.leaderboard.filter((p) => p.points > 0).slice(0, 3).map(({ name, points }) => ({ name, points })),
        setup: s.setup,
        lastActivityAt: s.recent[0]?.at || null,
      }
    })

    const sum = (key: keyof (typeof stats)[number]['totals']) => stats.reduce((t, s) => t + s.totals[key], 0)
    return res.status(200).json({
      isSuper: ctx.isSuper,
      adminName: ctx.user.name,
      totals: {
        events: stats.length,
        liveEvents: summaries.filter((s) => s.phase === 'LIVE').length,
        zones: stats.reduce((t, s) => t + s.zones.length, 0),
        registered: sum('registered'),
        started: sum('started'),
        completedAll: sum('completedAll'),
        scans: sum('scans'),
        pointsAwarded: sum('pointsAwarded'),
      },
      events: summaries,
      recent: stats
        .flatMap((s) => s.recent.map((r) => ({ ...r, eventName: s.event.name, eventId: s.event.id })))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 12),
    })
  } catch (error) {
    console.error('Overview stats error:', error)
    return res.status(500).json({ error: 'Failed to load dashboard' })
  }
}
