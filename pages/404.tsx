import React from 'react'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-white mb-4">404</div>
        <h1 className="text-4xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-xl text-blue-100 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>

        <Link href="/">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  )
}
