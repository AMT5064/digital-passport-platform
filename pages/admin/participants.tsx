import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ParticipantsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">👥 Participants</h1>
          <Link href="/admin">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Back
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Participant management</p>
          <p className="text-sm text-gray-500">View and manage event attendees</p>
        </div>
      </div>
    </div>
  )
}
