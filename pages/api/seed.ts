import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
const bcrypt = require('bcrypt')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create Super Admin
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@digitialpassport.com' },
      update: {},
      create: {
        email: 'admin@digitialpassport.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: await bcrypt.hash('Admin@123', 10),
        role: 'SUPER_ADMIN',
      },
    })

    // Create sample attendee
    const user = await prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: await bcrypt.hash('User@123', 10),
        role: 'ATTENDEE',
      },
    })

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      admin: admin.email,
      user: user.email,
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    res.status(500).json({ error: error.message })
  }
}
