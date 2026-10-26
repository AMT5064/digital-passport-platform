import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureEventAccess, requireAdmin } from '@/lib/auth'
import { getActivityResults, getEventStats } from '@/lib/eventStats'
import { registrationFormFromConfig } from '@/lib/registration'

const TYPES = ['leaderboard', 'participants', 'responses', 'booths']

// Quotes every cell, and stops spreadsheet apps treating text like "=SUM(...)" as a formula
const cell = (value: unknown) => {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const ctx = await requireAdmin(req, res)
  if (!ctx) return

  const { eventId, type } = req.query
  if (typeof eventId !== 'string' || typeof type !== 'string' || !TYPES.includes(type)) {
    return res.status(400).json({ error: 'eventId and a valid type are required' })
  }
  if (!ensureEventAccess(ctx, res, eventId)) return

  try {
    const stats = await getEventStats(eventId)
    if (!stats) {
      return res.status(404).json({ error: 'Event not found' })
    }

    let csv = ''
    if (type === 'leaderboard') {
      csv = toCsv(
        ['Rank', 'Name', 'Email', 'Company', 'Points', 'Booths completed', ...stats.zones.map((z) => z.name), 'Last activity'],
        stats.leaderboard.map((p) => [
          p.rank,
          p.name,
          p.email,
          p.company,
          p.points,
          `${p.zonesCompleted}/${stats.zones.length}`,
          ...stats.zones.map((z) => (z.id in p.zonePoints ? p.zonePoints[z.id] : '')),
          p.lastActivityAt,
        ])
      )
    }

    if (type === 'participants') {
      const [users, config] = await Promise.all([
        prisma.user.findMany({
          where: { eventId },
          select: { id: true, firstName: true, lastName: true, email: true, mobile: true, company: true, designation: true, registrationData: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.registrationConfig.findUnique({ where: { eventId } }),
      ])
      const custom = registrationFormFromConfig(config).customFields
      const rankOf = new Map(stats.leaderboard.map((p) => [p.userId, p]))
      csv = toCsv(
        ['First name', 'Last name', 'Email', 'Mobile', 'Company', 'Job title', ...custom.map((c) => c.label), 'Registered', 'Points', 'Booths completed', 'Rank'],
        users.map((u) => {
          const answers = (u.registrationData || {}) as Record<string, unknown>
          const r = rankOf.get(u.id)
          return [
            u.firstName,
            u.lastName,
            u.email,
            u.mobile,
            u.company,
            u.designation,
            ...custom.map((c) => (c.type === 'CHECKBOX' ? (answers[c.id] === true ? 'Yes' : 'No') : answers[c.id])),
            u.createdAt.toISOString(),
            r?.points ?? 0,
            r?.zonesCompleted ?? 0,
            r?.rank ?? '',
          ]
        })
      )
    }

    if (type === 'responses') {
      const { responses } = await getActivityResults(eventId)
      csv = toCsv(
        ['Name', 'Email', 'Company', 'Booth', 'Activity', 'Type', 'Answer', 'Points', 'Completed at'],
        responses.map((r) => [r.name, r.email, r.company, r.zone, r.activity, r.type, r.answer, r.points, r.at])
      )
    }

    if (type === 'booths') {
      csv = toCsv(
        ['Booth', 'QR code', 'Points', 'Activity', 'Activity type', 'Visits', 'Share of participants'],
        stats.zones.map((z) => [
          z.name,
          z.qrSlug,
          z.points,
          z.activityTitle,
          z.activityType,
          z.visits,
          stats.totals.registered ? `${Math.round((z.visits / stats.totals.registered) * 100)}%` : '0%',
        ])
      )
    }

    const slug = stats.event.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event'
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-${type}-${new Date().toISOString().slice(0, 10)}.csv"`)
    // The BOM makes Excel read names with accents correctly
    return res.status(200).send('﻿' + csv)
  } catch (error) {
    console.error('Export error:', error)
    return res.status(500).json({ error: 'Export failed' })
  }
}
