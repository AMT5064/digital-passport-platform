import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { MapPin, Plus, Edit2, Trash2, X, ArrowLeft, QrCode } from 'lucide-react'

interface Zone {
  id: string
  name: string
  description?: string
  qrSlug: string
  points: number
  active: boolean
  _count?: {
    scans: number
  }
}

export default function ZonesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    qrSlug: '',
    points: 10,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      fetchZones()
    }
  }, [status, router])

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/zones?eventId=event-1')
      const data = await response.json()
      setZones(data)
    } catch (error) {
      console.error('Error fetching zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? { ...formData, id: editingId }
        : { ...formData, eventId: 'event-1' }

      const response = await fetch('/api/zones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchZones()
        setShowForm(false)
        setEditingId(null)
        setFormData({
          name: '',
          description: '',
          qrSlug: '',
          points: 10,
        })
      }
    } catch (error) {
      console.error('Error saving zone:', error)
    }
  }

  const handleEdit = (zone: Zone) => {
    setFormData({
      name: zone.name,
      description: zone.description || '',
      qrSlug: zone.qrSlug,
      points: zone.points,
    })
    setEditingId(zone.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return

    try {
      const response = await fetch('/api/zones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        fetchZones()
      }
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-2xl font-bold">Zones Management</h1>
                <p className="text-xs text-gray-400">Create and manage QR code zones</p>
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
                qrSlug: '',
                points: 10,
              })
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-lg transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Zone
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border border-white/10 rounded-xl p-6 mb-8 animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Zone' : 'Create New Zone'}</h2>
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
                  <label className="block text-sm font-medium mb-2">Zone Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                    placeholder="Enter zone name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">QR Code Slug *</label>
                  <input
                    type="text"
                    value={formData.qrSlug}
                    onChange={(e) => setFormData({ ...formData, qrSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                    placeholder="e.g., hall-a"
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
                  placeholder="Zone description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Points Awarded</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none transition"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-2 rounded-lg transition-all font-semibold"
                >
                  {editingId ? 'Update Zone' : 'Create Zone'}
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

        {/* Zones Table */}
        {zones.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Zones Created Yet</h3>
            <p className="text-gray-400 mb-6">Create your first zone to set up QR code scanning</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-6 py-2 rounded-lg transition-all font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Zone
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 backdrop-blur">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Zone Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">QR Slug</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Points</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Scans</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{zone.name}</p>
                        {zone.description && <p className="text-sm text-gray-400">{zone.description}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-white/10 px-3 py-1 rounded text-sm">{zone.qrSlug}</code>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{zone.points} pts</td>
                    <td className="px-6 py-4 text-sm">{zone._count?.scans || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(zone)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded transition-colors text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded transition-colors text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
