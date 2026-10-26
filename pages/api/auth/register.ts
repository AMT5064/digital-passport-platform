import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { ApiResponse } from '@/types'
import { checkRegistration, registrationFormFromConfig } from '@/lib/registration'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, firstName, lastName, password, mobile, company, designation, eventId, registrationData } =
      req.body

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    // When registering for a specific event, apply that event's form rules
    let answers: Record<string, string | boolean> | undefined
    const event = eventId
      ? await prisma.event.findUnique({ where: { id: String(eventId) }, include: { registrationConfig: true } })
      : null
    if (eventId) {
      if (!event) {
        return res.status(400).json({ success: false, error: 'Event not found' })
      }
      const form = registrationFormFromConfig(event.registrationConfig)
      const problem = checkRegistration(form, req.body)
      if (problem) {
        return res.status(400).json({ success: false, error: problem })
      }
      // Keep only answers to this event's own questions
      answers = {}
      for (const c of form.customFields) {
        const value = registrationData?.[c.id]
        if (c.type === 'CHECKBOX') answers[c.id] = value === true
        else if (value) answers[c.id] = String(value).slice(0, 500)
      }
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
        eventId: event?.id,
        ...(answers && { registrationData: answers }),
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
