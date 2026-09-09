import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { LogOut, QrCode, Trophy, Info, Menu, X } from 'lucide-react'

export default function AttendeeLayout({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/passport" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="font-bold text-sm">DP</span>
              </div>
              <span className="font-semibold text-sm hidden sm:block">Digital Passport</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/passport"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  router.pathname === '/passport'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode size={16} /> Dashboard
              </Link>
              <Link
                href="/leaderboard?eventId=event-1"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  router.pathname === '/leaderboard'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Trophy size={16} /> Leaderboard
              </Link>
              <Link
                href="/event"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  router.pathname === '/event'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Info size={16} /> Event
              </Link>
            </nav>

            {/* User + sign out */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-300 max-w-[120px] truncate">{session.user.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:block">Sign Out</span>
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden text-slate-400 hover:text-white"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {menuOpen && (
            <nav className="md:hidden pb-3 space-y-1">
              <Link
                href="/passport"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <QrCode size={16} /> Dashboard
              </Link>
              <Link
                href="/leaderboard?eventId=event-1"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Trophy size={16} /> Leaderboard
              </Link>
              <Link
                href="/event"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Info size={16} /> Event
              </Link>
            </nav>
          )}
        </div>
      </header>

      {title && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</div>
    </div>
  )
}
