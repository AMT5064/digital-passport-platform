import React from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()

  React.useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      if (session.user.role === 'ATTENDEE') {
        router.push('/passport')
      } else {
        router.push('/admin')
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Digital Passport</h1>
        <p className="text-gray-600 mb-8">Event Engagement Platform</p>

        <div className="space-y-4">
          <Link href="/login">
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
              Sign In
            </button>
          </Link>

          <Link href="/register">
            <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
              Register as Attendee
            </button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p>Scan a QR code at an event booth to get started</p>
        </div>
      </div>
    </div>
  )
}
