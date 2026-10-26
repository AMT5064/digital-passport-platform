import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { registrationFormFromConfig } from '@/lib/registration'

// Public branding and registration form for an event, used by the attendee pages
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event id' })
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        venue: true,
        startDate: true,
        endDate: true,
        logo: true,
        bannerImage: true,
        themeColor: true,
        registrationConfig: true,
      },
    })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const { registrationConfig, ...branding } = event
    return res.status(200).json({ ...branding, registration: registrationFormFromConfig(registrationConfig) })
  } catch (error) {
    console.error('Public event error:', error)
    return res.status(500).json({ error: 'Failed to load event' })
  }
}
