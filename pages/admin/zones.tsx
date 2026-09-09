import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AdminLayout from '@/components/AdminLayout'
import { Plus, MapPin, X, QrCode, Loader2 } from 'lucide-react'

interface Zone {
  id: string
  name: string
  description: string
  qrSlug: string
  points: number
  active: boolean
  activity?: { type: string } | null
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', points: 10 })

  const fetchZones = async () => {
    try {
      const res = await axios.get('/api/admin/zones?eventId=event-1')
      if (res.data.success) setZones(res.data.data)
    } catch {
      // fallback to empty
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/admin/zones?eventId=event-1', {
        name: formData.name,
        description: formData.description,
        points: formData.points,
      })
      if (res.data.success) {
        setZones([...zones, res.data.data])
        setShowCreateForm(false)
        setFormData({ name: '', description: '', points: 10 })
      }
    } catch {
      // ignore
    }
  }

  return (
    <AdminLayout
      title="Zones"
      description="Create and manage QR zones"
      action={
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={18} /> Create Zone
        </button>
      }
    >
      {showCreateForm && (
        <div className="premium-card p-5 sm:p-6 mb-6 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Create New Zone</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateZone} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Zone Name</label>
              <input type="text" placeholder="Hall A - Registration" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea placeholder="Zone description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Points</label>
              <input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">Create Zone</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="border border-slate-300 text-slate-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <MapPin size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No zones created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="premium-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${zone.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {zone.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{zone.name}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{zone.description || 'No description'}</p>
              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">QR Slug</span>
                  <span className="font-mono font-medium text-slate-700">{zone.qrSlug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Points</span>
                  <span className="font-semibold text-amber-600">{zone.points} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Activity</span>
                  <span className="font-medium text-slate-700">{zone.activity?.type?.replace(/_/g, ' ') || 'None'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                  <QrCode size={14} /> QR
                </button>
                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors">Edit</button>
                <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
