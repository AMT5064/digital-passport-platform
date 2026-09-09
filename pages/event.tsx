import React from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AttendeeLayout from '@/components/AttendeeLayout'
import { Calendar, MapPin, Gamepad2, Info, ArrowRight } from 'lucide-react'

export default function EventPage() {
  const { data: session } = useSession()

  const event = {
    name: 'Tech Summit 2024',
    description: 'Annual technology summit featuring innovations and demos',
    startDate: '2024-06-20',
    endDate: '2024-06-22',
    venue: 'Convention Center, San Francisco',
    zones: 4,
    activities: 7,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
  }

  const details = [
    { label: 'Event Duration', value: `${event.startDate} — ${event.endDate}`, icon: Calendar },
    { label: 'Venue', value: event.venue, icon: MapPin },
    { label: 'Zones', value: event.zones, icon: MapPin },
    { label: 'Activities', value: event.activities, icon: Gamepad2 },
  ]

  return (
    <AttendeeLayout title={event.name}>
      {/* Hero image */}
      <div className="rounded-2xl overflow-hidden h-48 sm:h-64 mb-6 relative">
        <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{event.name}</h2>
          <p className="text-sm text-white/80">{event.venue}</p>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {details.map((d) => {
          const Icon = d.icon
          return (
            <div key={d.label} className="premium-card p-4">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                <Icon size={18} className="text-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">{d.label}</p>
              <p className="text-sm font-bold text-slate-900">{d.value}</p>
            </div>
          )
        })}
      </div>

      {/* About */}
      <div className="premium-card p-5 sm:p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Info size={18} className="text-slate-400" /> About the Event
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">{event.description}</p>

        <h4 className="font-semibold text-slate-900 mb-3 text-sm">How to Participate</h4>
        <ol className="space-y-2.5">
          {[
            'Register for the event',
            'Receive your digital passport',
            'Scan QR codes at different zones',
            'Complete activities and earn points',
            'Climb the leaderboard and win rewards',
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        {session?.user ? (
          <>
            <Link href="/passport" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
            <Link href="/leaderboard?eventId=event-1" className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              View Leaderboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Register Now <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Sign In
            </Link>
          </>
        )}
      </div>
    </AttendeeLayout>
  )
}
