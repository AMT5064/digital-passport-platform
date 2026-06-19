import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function EventPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const event = {
    name: 'Tech Summit 2024',
    description: 'Annual technology summit featuring innovations and demos',
    startDate: '2024-06-20',
    endDate: '2024-06-22',
    venue: 'Convention Center, San Francisco',
    zones: 4,
    activities: 7,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
          <p className="text-xl text-blue-100">{event.venue}</p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Image */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg h-96 bg-gray-200">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DetailCard
            label="Event Duration"
            value={`${event.startDate} - ${event.endDate}`}
            icon="📅"
          />
          <DetailCard label="Zones" value={event.zones.toString()} icon="📍" />
          <DetailCard label="Activities" value={event.activities.toString()} icon="🎮" />
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">About the Event</h2>
          <p className="text-gray-600 leading-relaxed mb-4">{event.description}</p>

          <h3 className="text-xl font-bold text-gray-800 mb-4">How to Participate</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Register for the event</li>
            <li>Receive your digital passport</li>
            <li>Scan QR codes at different zones</li>
            <li>Complete activities and earn points</li>
            <li>Climb the leaderboard and win rewards</li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          {session?.user ? (
            <>
              <Link href="/passport">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
                  Go to Dashboard
                </button>
              </Link>
              <Link href="/leaderboard?eventId=event-1">
                <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold transition">
                  View Leaderboard
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/register">
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold transition">
                  Register Now
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
                  Sign In
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
