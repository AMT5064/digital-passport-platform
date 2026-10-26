import { prisma } from './prisma'

// One place that turns an event's raw scans into rankings and progress, so the dashboard,
// campaign analytics, projector screen and exports always agree.

export interface RankedParticipant {
  rank: number
  userId: string
  name: string
  email: string
  company: string | null
  points: number
  zonesCompleted: number
  zonePoints: Record<string, number>
  lastActivityAt: string | null
  registeredAt: string
}

export interface ZoneStat {
  id: string
  name: string
  qrSlug: string
  points: number
  activityType: string | null
  activityTitle: string | null
  visits: number
}

export interface EventStats {
  event: {
    id: string
    name: string
    description: string | null
    venue: string | null
    status: string
    startDate: string
    endDate: string
    themeColor: string
    bannerImage: string | null
    logo: string | null
  }
  zones: ZoneStat[]
  totals: {
    registered: number
    started: number
    completedAll: number
    scans: number
    pointsAwarded: number
    maxPoints: number
  }
  leaderboard: RankedParticipant[]
  recent: { name: string; zoneName: string; points: number; at: string }[]
  registrationsByDay: { day: string; count: number }[]
  scansByHour: { hour: string; count: number }[]
  setup: { hasBranding: boolean; zones: number; zonesWithoutActivity: string[] }
}

const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim()

export async function getEventStats(eventId: string): Promise<EventStats | null> {
  const [event, users, scans] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        zones: { include: { activities: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'asc' } },
        registrationConfig: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      where: { eventId },
      select: { id: true, firstName: true, lastName: true, email: true, company: true, createdAt: true },
    }),
    prisma.scan.findMany({
      where: { eventId },
      select: { userId: true, zoneId: true, pointsEarned: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  if (!event) return null

  const zoneName = new Map(event.zones.map((z) => [z.id, z.name]))
  const userById = new Map(users.map((u) => [u.id, u]))

  const perUser = new Map<string, { points: number; zones: Set<string>; zonePoints: Record<string, number>; last: Date }>()
  const visits: Record<string, number> = {}
  for (const s of scans) {
    visits[s.zoneId] = (visits[s.zoneId] || 0) + 1
    const entry = perUser.get(s.userId) || { points: 0, zones: new Set<string>(), zonePoints: {}, last: s.createdAt }
    entry.points += s.pointsEarned
    entry.zones.add(s.zoneId)
    entry.zonePoints[s.zoneId] = (entry.zonePoints[s.zoneId] || 0) + s.pointsEarned
    entry.last = s.createdAt
    perUser.set(s.userId, entry)
  }

  // Everyone registered appears; ties go to whoever got there first
  const ranked = users
    .map((u) => {
      const e = perUser.get(u.id)
      return {
        userId: u.id,
        name: fullName(u),
        email: u.email,
        company: u.company,
        points: e?.points || 0,
        zonesCompleted: e?.zones.size || 0,
        zonePoints: e?.zonePoints || {},
        lastActivityAt: e ? e.last.toISOString() : null,
        registeredAt: u.createdAt.toISOString(),
      }
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.zonesCompleted - a.zonesCompleted ||
        (a.lastActivityAt || '9').localeCompare(b.lastActivityAt || '9') ||
        a.name.localeCompare(b.name)
    )
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const zoneCount = event.zones.length
  const byDay: Record<string, number> = {}
  for (const u of users) {
    const day = u.createdAt.toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  }
  const byHour: Record<string, number> = {}
  for (const s of scans) {
    const hour = s.createdAt.toISOString().slice(0, 13) + ':00'
    byHour[hour] = (byHour[hour] || 0) + 1
  }

  return {
    event: {
      id: event.id,
      name: event.name,
      description: event.description,
      venue: event.venue,
      status: event.status,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      themeColor: event.themeColor,
      bannerImage: event.bannerImage,
      logo: event.logo,
    },
    zones: event.zones.map((z) => ({
      id: z.id,
      name: z.name,
      qrSlug: z.qrSlug,
      points: z.points,
      activityType: z.activities[0]?.type || null,
      activityTitle: z.activities[0]?.title || null,
      visits: visits[z.id] || 0,
    })),
    totals: {
      registered: users.length,
      started: ranked.filter((p) => p.zonesCompleted > 0).length,
      completedAll: zoneCount ? ranked.filter((p) => p.zonesCompleted >= zoneCount).length : 0,
      scans: scans.length,
      pointsAwarded: scans.reduce((sum, s) => sum + s.pointsEarned, 0),
      maxPoints: event.zones.reduce((sum, z) => sum + z.points, 0),
    },
    leaderboard: ranked,
    recent: scans
      .slice(-15)
      .reverse()
      .map((s) => ({
        name: userById.get(s.userId) ? fullName(userById.get(s.userId)!) : 'Someone',
        zoneName: zoneName.get(s.zoneId) || 'a booth',
        points: s.pointsEarned,
        at: s.createdAt.toISOString(),
      })),
    registrationsByDay: Object.entries(byDay)
      .sort()
      .map(([day, count]) => ({ day, count })),
    scansByHour: Object.entries(byHour)
      .sort()
      .map(([hour, count]) => ({ hour, count })),
    setup: {
      hasBranding: !!(event.bannerImage || event.registrationConfig),
      zones: zoneCount,
      zonesWithoutActivity: event.zones.filter((z) => z.activities.length === 0).map((z) => z.name),
    },
  }
}

export interface ActivityResult {
  zoneId: string
  zoneName: string
  activityId: string
  type: string
  title: string
  completions: number
  quiz?: { correct: number; wrong: number }
  options?: { text: string; count: number }[]
  questions?: { text: string; type: string; answers: { value: string; count: number }[]; average?: number }[]
}

export interface ResponseRow {
  name: string
  email: string
  company: string
  zone: string
  activity: string
  type: string
  answer: string
  points: number
  at: string
}

const toList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v !== undefined && v !== null && v !== '' ? [String(v)] : [])

// Per-activity outcomes plus one readable row per completion, from what attendees submitted
export async function getActivityResults(eventId: string): Promise<{ results: ActivityResult[]; responses: ResponseRow[] }> {
  const [zones, logs, scans] = await Promise.all([
    prisma.zone.findMany({ where: { eventId }, include: { activities: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'asc' } }),
    prisma.activityLog.findMany({
      where: { eventId, action: 'ZONE_SCANNED' },
      select: { userId: true, zoneId: true, details: true, createdAt: true, user: { select: { firstName: true, lastName: true, email: true, company: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.scan.findMany({ where: { eventId }, select: { userId: true, zoneId: true, pointsEarned: true } }),
  ])
  const pointsFor = new Map(scans.map((s) => [`${s.userId}:${s.zoneId}`, s.pointsEarned]))

  const results: ActivityResult[] = []
  const responses: ResponseRow[] = []

  for (const zone of zones) {
    const activity = zone.activities[0]
    if (!activity) continue
    const zoneLogs = logs.filter((l) => l.zoneId === zone.id)
    const result: ActivityResult = {
      zoneId: zone.id,
      zoneName: zone.name,
      activityId: activity.id,
      type: activity.type,
      title: activity.title || activity.type,
      completions: zoneLogs.length,
    }
    const answers = (activity.answers as any[]) || []
    const pollOptions = (activity.pollOptions as any[]) || []
    const questions = ((activity.surveyQuestions as any[]) || []).filter((q) => typeof q === 'object')
    const textFor = (list: any[], ids: string[]) => ids.map((id) => list.find((o) => String(o.id) === id)?.text || id)

    if (activity.type === 'QUIZ') result.quiz = { correct: 0, wrong: 0 }
    if (activity.type === 'POLL') result.options = pollOptions.map((o) => ({ text: o.text, count: 0 }))
    if (activity.type === 'SURVEY') result.questions = questions.map((q) => ({ text: q.text, type: q.type, answers: [] }))

    for (const log of zoneLogs) {
      const data = ((log.details as any)?.activityData || {}) as Record<string, any>
      const points = pointsFor.get(`${log.userId}:${zone.id}`) ?? 0
      let answerText = ''

      if (activity.type === 'QUIZ') {
        const picked = toList(data.quizAnswer)
        answerText = textFor(answers, picked).join(', ')
        if (points > 0) result.quiz!.correct++
        else result.quiz!.wrong++
      } else if (activity.type === 'POLL') {
        const picked = toList(data.pollAnswer)
        answerText = textFor(pollOptions, picked).join(', ')
        for (const id of picked) {
          const text = pollOptions.find((o) => String(o.id) === id)?.text
          const opt = result.options!.find((o) => o.text === text)
          if (opt) opt.count++
        }
      } else if (activity.type === 'SURVEY') {
        const survey = (data.surveyAnswers || {}) as Record<string, unknown>
        const parts: string[] = []
        questions.forEach((q, i) => {
          const raw = toList(survey[q.id])
          if (raw.length === 0) return
          const values = q.options?.length ? textFor(q.options, raw) : raw
          parts.push(`${q.text}: ${values.join(', ')}`)
          const bucket = result.questions![i]
          for (const v of values) {
            const existing = bucket.answers.find((a) => a.value === v)
            if (existing) existing.count++
            else bucket.answers.push({ value: v, count: 1 })
          }
        })
        answerText = parts.join(' | ')
      } else {
        answerText = activity.type === 'DOWNLOAD' ? 'Downloaded' : activity.type === 'RAFFLE' ? 'Entered draw' : 'Completed'
      }

      responses.push({
        name: `${log.user.firstName} ${log.user.lastName}`.trim(),
        email: log.user.email,
        company: log.user.company || '',
        zone: zone.name,
        activity: activity.title || activity.type,
        type: activity.type,
        answer: answerText,
        points,
        at: log.createdAt.toISOString(),
      })
    }

    // Ratings and scales also get an average
    for (const q of result.questions || []) {
      if (q.type === 'RATING' || q.type === 'SCALE') {
        const nums = q.answers.flatMap((a) => Array(a.count).fill(Number(a.value))).filter((n) => !isNaN(n))
        if (nums.length) q.average = Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
      }
      q.answers.sort((a, b) => b.count - a.count)
    }
    results.push(result)
  }

  return { results, responses }
}
