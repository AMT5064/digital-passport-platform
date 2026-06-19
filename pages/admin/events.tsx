import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface Event {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  venue: string
  status: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'ARCHIVED'
  participants: number
}

export default function EventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([
    {
      id: 'event-1',
      name: 'Tech Summit 2024',
      description: 'Annual technology summit',
      startDate: '2024-06-20',
      endDate: '2024-06-22',
      venue: 'Convention Center',
      status: 'PUBLISHED',
      participants: 0,
    },
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
  })

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, would save to database
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      ...formData,
      status: 'DRAFT',
      participants: 0,
    }
    setEvents([...events, newEvent])
    setShowCreateForm(false)
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      venue: '',
    })
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">📅 Events</h1>
          <Link href="/admin">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Back to Admin
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Event Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            + Create Event
          </button>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Event Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border border-gray-300 rounded px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="Venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="border border-gray-300 rounded px-4 py-2"
                />
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-4 py-2"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="border border-gray-300 rounded px-4 py-2"
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="border border-gray-300 rounded px-4 py-2"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Event Name</th>
                <th className="px-6 py-3 text-left font-semibold">Dates</th>
                <th className="px-6 py-3 text-left font-semibold">Venue</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Participants</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{event.name}</td>
                  <td className="px-6 py-4 text-sm">
                    {event.startDate} to {event.endDate}
                  </td>
                  <td className="px-6 py-4 text-sm">{event.venue}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        event.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'LIVE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{event.participants}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button className="text-purple-600 hover:underline text-sm">Manage</button>
                    <button className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
