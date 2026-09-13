import React from 'react'
import Link from 'next/link'
import { Home, ArrowRight, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl animate-scale-in">
        {/* 404 Number */}
        <div className="mb-8">
          <span className="text-gradient text-9xl font-black tracking-tighter">404</span>
        </div>

        {/* Error Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Search className="w-10 h-10 text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-300 mb-12">
          Looks like this page has gone on an adventure. Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 rounded-xl font-semibold transition-all">
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Helpful Info */}
        <div className="mt-16 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-gray-300">
            <strong>Need help?</strong> Check the URL is correct or head back to explore our platform.
          </p>
        </div>
      </div>
    </div>
  )
}
