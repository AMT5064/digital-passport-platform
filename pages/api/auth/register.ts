import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { ApiResponse } from '@/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, firstName, lastName, password, mobile, company, designation, eventId } =
      req.body

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        mobile,
        company,
        designation,
        eventId,
        role: 'ATTENDEE',
      },
    })

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}
