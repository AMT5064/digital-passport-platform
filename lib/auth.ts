import type { NextApiRequest, NextApiResponse } from 'next'
import { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

const bcrypt = require('bcrypt')

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      email: string
      name: string
      image: string | null
    }
  }
  interface User {
    id: string
    role: string
    email: string
    name: string
    image: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        // Check if it's an admin
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        })

        if (admin) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            admin.password
          )

          if (!isPasswordValid) {
            throw new Error('Invalid password')
          }
          if (!admin.isActive) {
            throw new Error('Account disabled')
          }
          await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })

          return {
            id: admin.id,
            email: admin.email,
            name: `${admin.firstName} ${admin.lastName}`,
            role: admin.role,
            image: null,
          }
        }

        // Check if it's a user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('User not found')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.avatar || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  debug: process.env.NODE_ENV === 'development',
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'EVENT_ADMIN']

export interface AdminContext {
  user: { id: string; role: string; email: string; name: string; image: string | null }
  isSuper: boolean
  // Events this admin may manage; ignored for super admins
  eventIds: string[]
  canAccess: (eventId: string | null | undefined) => boolean
}

// For admin-only API routes: sends 401/403 and returns null unless an active admin is signed in.
// The admin row is read on every request so access changes and deactivation apply immediately.
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<AdminContext | null> {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  if (!ADMIN_ROLES.includes(session.user.role)) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }
  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { role: true, eventAccess: true, isActive: true },
  })
  if (!admin || !admin.isActive) {
    res.status(403).json({ error: 'Your admin access has been removed' })
    return null
  }
  const isSuper = admin.role === 'SUPER_ADMIN'
  return {
    user: { ...session.user, role: admin.role },
    isSuper,
    eventIds: admin.eventAccess,
    canAccess: (eventId) => isSuper || (!!eventId && admin.eventAccess.includes(eventId)),
  }
}

// Sends 403 and returns false when the admin may not manage this event
export function ensureEventAccess(ctx: AdminContext, res: NextApiResponse, eventId: string | null | undefined): boolean {
  if (ctx.canAccess(eventId)) return true
  res.status(403).json({ error: 'You do not have access to this event' })
  return false
}

// Sends 403 and returns false unless this is a super admin
export function ensureSuperAdmin(ctx: AdminContext, res: NextApiResponse): boolean {
  if (ctx.isSuper) return true
  res.status(403).json({ error: 'Only super admins can do this' })
  return false
}
