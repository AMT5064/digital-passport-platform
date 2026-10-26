import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureSuperAdmin, requireAdmin } from '@/lib/auth'

const bcrypt = require('bcrypt')

const ROLES = ['SUPER_ADMIN', 'EVENT_ADMIN']
const PUBLIC_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  eventAccess: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const

// Event admins with no events, or pointing at deleted events, get only the events that exist
async function validEventIds(ids: unknown): Promise<string[]> {
  const list = Array.isArray(ids) ? ids.map(String) : []
  if (list.length === 0) return []
  const events = await prisma.event.findMany({ where: { id: { in: list } }, select: { id: true } })
  return events.map((e) => e.id)
}

// The last active super admin can't be demoted, disabled or removed, so nobody gets locked out
async function isLastSuperAdmin(id: string) {
  const target = await prisma.admin.findUnique({ where: { id }, select: { role: true, isActive: true } })
  if (target?.role !== 'SUPER_ADMIN' || !target.isActive) return false
  const others = await prisma.admin.count({ where: { role: 'SUPER_ADMIN', isActive: true, id: { not: id } } })
  return others === 0
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await requireAdmin(req, res)
  if (!ctx || !ensureSuperAdmin(ctx, res)) return

  try {
    if (req.method === 'GET') {
      const admins = await prisma.admin.findMany({ select: PUBLIC_FIELDS, orderBy: { createdAt: 'asc' } })
      return res.status(200).json(admins)
    }

    if (req.method === 'POST') {
      const { email, firstName, lastName, password, role, eventAccess } = req.body || {}
      const cleanEmail = String(email || '').trim().toLowerCase()
      if (!cleanEmail || !firstName?.trim() || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' })
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Enter a valid email address' })
      }
      if (String(password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
      }
      if (!ROLES.includes(role)) {
        return res.status(400).json({ error: 'Choose full access or event access' })
      }
      const events = role === 'EVENT_ADMIN' ? await validEventIds(eventAccess) : []
      if (role === 'EVENT_ADMIN' && events.length === 0) {
        return res.status(400).json({ error: 'Pick at least one event for this admin' })
      }
      // Sign-in checks admins before attendees, so an email can only belong to one of them
      const [adminTaken, userTaken] = await Promise.all([
        prisma.admin.findUnique({ where: { email: cleanEmail }, select: { id: true } }),
        prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } }),
      ])
      if (adminTaken || userTaken) {
        return res.status(409).json({ error: 'That email is already in use' })
      }

      const admin = await prisma.admin.create({
        data: {
          email: cleanEmail,
          firstName: String(firstName).trim(),
          lastName: String(lastName || '').trim(),
          password: await bcrypt.hash(String(password), 10),
          role,
          eventAccess: events,
        },
        select: PUBLIC_FIELDS,
      })
      return res.status(201).json(admin)
    }

    if (req.method === 'PUT') {
      const { id, role, eventAccess, isActive, password, firstName, lastName } = req.body || {}
      if (!id) {
        return res.status(400).json({ error: 'Admin ID required' })
      }
      const demoting = role === 'EVENT_ADMIN' || isActive === false
      if (demoting && (await isLastSuperAdmin(id))) {
        return res.status(400).json({ error: 'Keep at least one active super admin' })
      }
      if (id === ctx.user.id && isActive === false) {
        return res.status(400).json({ error: "You can't disable your own account" })
      }
      if (role !== undefined && !ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }
      if (password !== undefined && String(password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
      }

      const nextRole = role ?? (await prisma.admin.findUnique({ where: { id }, select: { role: true } }))?.role
      const events = eventAccess !== undefined ? await validEventIds(eventAccess) : undefined
      if (nextRole === 'EVENT_ADMIN' && events !== undefined && events.length === 0) {
        return res.status(400).json({ error: 'Pick at least one event for this admin' })
      }

      const admin = await prisma.admin.update({
        where: { id },
        data: {
          ...(role && { role }),
          ...(events !== undefined && { eventAccess: nextRole === 'SUPER_ADMIN' ? [] : events }),
          ...(typeof isActive === 'boolean' && { isActive }),
          ...(password && { password: await bcrypt.hash(String(password), 10) }),
          ...(firstName && { firstName: String(firstName).trim() }),
          ...(lastName !== undefined && { lastName: String(lastName).trim() }),
        },
        select: PUBLIC_FIELDS,
      })
      return res.status(200).json(admin)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) {
        return res.status(400).json({ error: 'Admin ID required' })
      }
      if (id === ctx.user.id) {
        return res.status(400).json({ error: "You can't remove your own account" })
      }
      if (await isLastSuperAdmin(id)) {
        return res.status(400).json({ error: 'Keep at least one active super admin' })
      }
      await prisma.admin.delete({ where: { id } })
      return res.status(200).json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Admins API error:', error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}
