import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import { ArrowLeft, Calendar, MapPin, Trophy } from 'lucide-react'

interface EventInfo {
  id: string
  name: string
  description: string | null
  venue: string | null
  startDate: string
  endDate: string
}

export default function EventPage() {
  const { status } = useSession()
  const router = useRouter()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [zonesTotal, setZonesTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=%2Fevent')
  }, [status, router])

  // The attendee's event is the one they joined with their first booth scan
  useEffect(() => {
    if (status !== 'authenticated') return
    axios
      .get('/api/passport-stats')
      .then((res) => {
        setEvent(res.data.event)
        setZonesTotal(res.data.zonesTotal)
      })
      .catch((err) => console.error('Failed to load event:', err))
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-8">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/passport" className="text-[#00CBB3]" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-oswald font-bold truncate">{event ? event.name : 'Event Details'}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {!event ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-gray-300 text-sm">Scan the QR code at any booth to join your event and see its details here.</p>
          </div>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <h2 className="text-2xl font-oswald font-bold">{event.name}</h2>
              {event.venue && (
                <p className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4 text-[#00CBB3]" /> {event.venue}
                </p>
              )}
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4 text-[#00CBB3]" /> {formatDate(event.startDate)} – {formatDate(event.endDate)}
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <Trophy className="w-4 h-4 text-[#FFB800]" /> {zonesTotal} booths to visit
              </p>
            </div>

            {event.description && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-base font-oswald font-bold mb-2">About the event</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
              </div>
            )}
          </>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-base font-oswald font-bold mb-2">How to participate</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
            <li>Scan the QR code at each booth</li>
            <li>Complete the booth&apos;s activity to earn points</li>
            <li>Climb the leaderboard and win rewards</li>
          </ol>
        </div>

        {event && (
          <Link
            href={`/leaderboard?eventId=${event.id}`}
            className="block w-full text-center bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] py-3 rounded-lg font-semibold transition-colors"
          >
            View Leaderboard
          </Link>
        )}
      </main>
    </div>
  )
}
