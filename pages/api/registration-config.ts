import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { configFromRegistrationForm, registrationFormFromConfig } from '@/lib/registration'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) return

  const eventId = (req.method === 'GET' ? req.query.eventId : req.body?.eventId) as string | undefined
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' })
  }

  try {
    if (req.method === 'GET') {
      const config = await prisma.registrationConfig.findUnique({ where: { eventId } })
      return res.status(200).json(registrationFormFromConfig(config))
    }

    if (req.method === 'PUT') {
      // Normalise through the form shape so only known fields and types are stored
      const data = configFromRegistrationForm(registrationFormFromConfig(configFromRegistrationForm(req.body.form)))
      await prisma.registrationConfig.upsert({
        where: { eventId },
        update: data,
        create: { eventId, ...data },
      })
      return res.status(200).json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Registration config error:', error)
    res.status(500).json({ error: error.message })
  }
}
