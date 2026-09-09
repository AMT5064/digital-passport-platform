import React, { useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Calendar, MapPin, X, Search } from 'lucide-react'

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
  const [events, setEvents] = useState<Event[]>([
    {
      id: 'event-1',
      name: 'Tech Summit 2024',
      description: 'Annual technology summit',
      startDate: '2024-06-20',
      endDate: '2024-06-22',
      venue: 'Convention Center, San Francisco',
      status: 'PUBLISHED',
      participants: 2,
    },
  ])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '', venue: '' })

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    const newEvent: Event = { id: `event-${Date.now()}`, ...formData, status: 'DRAFT', participants: 0 }
    setEvents([...events, newEvent])
    setShowCreateForm(false)
    setFormData({ name: '', description: '', startDate: '', endDate: '', venue: '' })
  }

  const statusStyles: Record<string, string> = {
    PUBLISHED: 'bg-emerald-50 text-emerald-700',
    LIVE: 'bg-blue-50 text-blue-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    ENDED: 'bg-amber-50 text-amber-700',
    ARCHIVED: 'bg-slate-100 text-slate-500',
  }

  return (
    <AdminLayout
      title="Events"
      description="Manage your events"
      action={
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={18} /> Create Event
        </button>
      }
    >
      {showCreateForm && (
        <div className="premium-card p-5 sm:p-6 mb-6 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Name</label>
                <input type="text" placeholder="Tech Summit 2024" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Venue</label>
                <input type="text" placeholder="Convention Center" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea placeholder="Event description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">Create Event</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="border border-slate-300 text-slate-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Events table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Event</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Dates</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Venue</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Participants</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Calendar size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{event.name}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{event.startDate} — {event.endDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">{event.startDate} — {event.endDate}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{event.venue}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[event.status]}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700 text-right hidden sm:table-cell">{event.participants}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">Edit</button>
                      <button className="text-slate-500 hover:text-slate-700 text-sm font-medium hidden sm:block">Manage</button>
                      <button className="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
