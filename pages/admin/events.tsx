import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ArrowLeft,
  Clock,
} from 'lucide-react'

interface Event {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  venue?: string
  status: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'ARCHIVED'
  themeColor?: string
  _count?: {
    attendees: number
    zones: number
    scans: number
  }
}

export default function EventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    themeColor: '#3B82F6',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchEvents()
    }
  }, [status, router])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { ...formData, id: editingId } : formData

      const response = await fetch('/api/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchEvents()
        setShowForm(false)
        setEditingId(null)
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          venue: '',
          themeColor: '#3B82F6',
        })
      }
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleEdit = (event: Event) => {
    setFormData({
      name: event.name,
      description: event.description || '',
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      venue: event.venue || '',
      themeColor: event.themeColor || '#3B82F6',
    })
    setEditingId(event.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] via-[#16123D] to-[#201751] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] via-[#16123D] to-[#201751] text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#201751]/50 to-[#16123D]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Events Management</h1>
                <p className="text-xs text-gray-400">Create and manage your events</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                venue: '',
                themeColor: '#3B82F6',
              })
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-lg transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-xl p-6 mb-8 animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                    placeholder="Enter event name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                    placeholder="Event location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                  rows={3}
                  placeholder="Event description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Theme Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-2 rounded-lg transition-all font-semibold"
                >
                  {editingId ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
            <p className="text-gray-400 mb-6">Create your first event to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-6 py-2 rounded-lg transition-all font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">{event.name}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {event.venue || 'No venue'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'LIVE'
                        ? 'bg-green-500/20 text-green-300'
                        : event.status === 'PUBLISHED'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-2 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </div>
                  {event._count && (
                    <>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {event._count.attendees} participants
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event._count.zones} zones
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleEdit(event)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
