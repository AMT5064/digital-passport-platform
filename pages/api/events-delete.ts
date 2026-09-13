import { prisma } from '@/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'DELETE') {
      const { id } = req.query

      const event = await prisma.event.delete({
        where: { id: id as string },
      })

      return res.status(200).json({ success: true, deleted: event })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Delete event error:', error)
    res.status(500).json({ error: error.message })
  }
}
