import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface Zone {
  id: string
  name: string
  description: string
  qrSlug: string
  points: number
  active: boolean
  activity?: string
}

export default function ZonesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([
    {
      id: 'zone-1',
      name: 'Hall A - Registration',
      description: 'Welcome and registration',
      qrSlug: 'hall-a',
      points: 10,
      active: true,
      activity: 'QUIZ',
    },
    {
      id: 'zone-2',
      name: 'Hall B - Product Demo',
      description: 'Live product demonstrations',
      qrSlug: 'hall-b',
      points: 15,
      active: true,
      activity: 'POLL',
    },
    {
      id: 'zone-3',
      name: 'Hall C - Keynote',
      description: 'Main keynote presentations',
      qrSlug: 'hall-c',
      points: 20,
      active: true,
      activity: 'RAFFLE',
    },
    {
      id: 'zone-4',
      name: 'Networking Lounge',
      description: 'Meet and greet',
      qrSlug: 'networking',
      points: 15,
      active: true,
      activity: 'SURVEY',
    },
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: 10,
  })

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault()
    const qrSlug = formData.name.toLowerCase().replace(/\s+/g, '-')
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      ...formData,
      qrSlug,
      active: true,
    }
    setZones([...zones, newZone])
    setShowCreateForm(false)
    setFormData({ name: '', description: '', points: 10 })
  }

  const downloadQR = (qrSlug: string) => {
    // In a real implementation, would generate and download QR code
    alert(`Download QR code for ${qrSlug}`)
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
          <h1 className="text-3xl font-bold">📍 Zones</h1>
          <Link href="/admin">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Back to Admin
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Zone Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            + Create Zone
          </button>
        </div>

        {/* Create Zone Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Zone</h2>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <input
                type="text"
                placeholder="Zone Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-4 py-2"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-4 py-2"
                rows={3}
              />
              <input
                type="number"
                placeholder="Points"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-4 py-2"
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Zone
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

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{zone.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{zone.description}</p>

              <div className="space-y-2 mb-4 text-sm">
                <p>
                  <strong>QR Slug:</strong> {zone.qrSlug}
                </p>
                <p>
                  <strong>Points:</strong> {zone.points}
                </p>
                <p>
                  <strong>Activity:</strong> {zone.activity || 'Not set'}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      zone.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {zone.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadQR(zone.qrSlug)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Download QR
                </button>
                <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
                  Edit
                </button>
                <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
