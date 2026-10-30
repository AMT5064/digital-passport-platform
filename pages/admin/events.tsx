import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Plus, X, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { AdminPage, EmptyState, Menu, MenuItem, PageTitle, PhaseBadge, Spinner, btn, eventPhase, panel } from '@/components/admin/ui'

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
    themeColor: '#00CBB3',
  })

  const isSuper = session?.user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchEvents()
    }
  }, [status, router])

  // The dashboard's "New event" button lands here with the form open
  useEffect(() => {
    if (router.query.new && isSuper) setShowForm(true)
  }, [router.query.new, isSuper])

  // An event's "Edit details" link lands here with that event's form open
  useEffect(() => {
    const target = events.find((e) => e.id === router.query.edit)
    if (target) handleEdit(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.edit, events])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(Array.isArray(data) ? data : [])
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
        // A new event goes straight to branding and registration setup
        if (!editingId) {
          const created = await response.json()
          router.push(`/admin/campaign/${created.id}/branding?new=1`)
          return
        }
        fetchEvents()
        closeFormState()
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          venue: '',
          themeColor: '#00CBB3',
        })
      }
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const closeFormState = () => {
    setShowForm(false)
    setEditingId(null)
    if (router.query.edit) router.replace('/admin/events', undefined, { shallow: true })
  }

  const handleEdit = (event: Event) => {
    setFormData({
      name: event.name,
      description: event.description || '',
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      venue: event.venue || '',
      themeColor: event.themeColor || '#00CBB3',
    })
    setEditingId(event.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event with all its booths, activities and results? This can\'t be undone.')) return

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

  if (status === 'loading' || loading) return <Spinner />

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    if (router.query.new || router.query.edit) router.replace('/admin/events', undefined, { shallow: true })
  }
  const field = 'w-full bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-[#00CBB3]/60 focus:outline-none'
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <AdminPage width="max-w-4xl">
      <PageTitle
        title="Events"
        subtitle={isSuper ? 'Every event, newest first.' : 'Events you have access to.'}
        actions={
          isSuper &&
          !showForm && (
            <button
              onClick={() => {
                setEditingId(null)
                setFormData({ name: '', description: '', startDate: '', endDate: '', venue: '', themeColor: '#00CBB3' })
                setShowForm(true)
              }}
              className={btn.primary}
            >
              <Plus className="w-4 h-4" /> New event
            </button>
          )
        }
      />

      {showForm && (
        <div className={`${panel} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-poppins font-semibold text-white">{editingId ? 'Edit event details' : 'New event'}</h2>
            <button onClick={closeForm} className={btn.icon} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm text-gray-300 mb-1.5">Event name</span>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className={field} placeholder="e.g. Tech Expo 2026" />
              </label>
              <label className="block">
                <span className="block text-sm text-gray-300 mb-1.5">Venue</span>
                <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className={field} placeholder="Hall, building, city" />
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="block text-sm text-gray-300 mb-1.5">Starts</span>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className={field} />
              </label>
              <label className="block">
                <span className="block text-sm text-gray-300 mb-1.5">Ends</span>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required className={field} />
              </label>
              <label className="block col-span-2 md:col-span-1">
                <span className="block text-sm text-gray-300 mb-1.5">Theme colour</span>
                <span className="flex gap-2">
                  <input type="color" value={formData.themeColor} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })} className="w-11 h-11 rounded-lg cursor-pointer bg-transparent" />
                  <input type="text" value={formData.themeColor} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })} className={field + ' font-mono text-sm'} />
                </span>
              </label>
            </div>
            <label className="block">
              <span className="block text-sm text-gray-300 mb-1.5">
                Description <span className="text-gray-500">(optional)</span>
              </span>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={field} rows={2} />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" className={btn.primary}>
                {editingId ? 'Save changes' : 'Create and continue to branding'}
              </button>
              <button type="button" onClick={closeForm} className={btn.ghost}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        !showForm && <EmptyState title="No events yet" text={isSuper ? 'Create your first event to get started.' : 'A super admin needs to give you access to an event.'} />
      ) : (
        <div className={`${panel} divide-y divide-white/[0.06]`}>
          {events.map((event) => (
            <div key={event.id} className="relative flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
              <span className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: event.themeColor || '#00CBB3' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/admin/campaign/${event.id}`} className="font-semibold text-white hover:text-white after:absolute after:inset-0">
                    {event.name}
                  </Link>
                  <PhaseBadge phase={eventPhase(event.startDate, event.endDate)} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {fmt(event.startDate)} – {fmt(event.endDate)}
                  {event.venue && ` · ${event.venue}`}
                </p>
              </div>
              {event._count && (
                <p className="hidden sm:block text-xs text-gray-400 text-right flex-shrink-0">
                  {event._count.attendees} registered
                  <span className="block text-gray-500">{event._count.zones} booths</span>
                </p>
              )}
              <div className="relative z-10">
                <Menu icon={<MoreHorizontal className="w-4 h-4" />}>
                  <MenuItem icon={Pencil} onClick={() => handleEdit(event)}>
                    Edit details
                  </MenuItem>
                  {isSuper && (
                    <MenuItem icon={Trash2} onClick={() => handleDelete(event.id)} danger>
                      Delete event
                    </MenuItem>
                  )}
                </Menu>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  )
}
