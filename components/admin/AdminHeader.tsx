import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, Calendar, Users, LogOut } from 'lucide-react'

// Top bar shared by the admin pages
export default function AdminHeader() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isSuper = session?.user?.role === 'SUPER_ADMIN'

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    ...(isSuper ? [{ href: '/admin/team', label: 'Team', icon: Users }] : []),
  ]

  return (
    <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#201751]/80 to-[#16123D]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#00CBB3] rounded-lg flex items-center justify-center font-bold text-[#16123D] text-sm">DP</div>
          <div className="hidden md:block">
            <p className="text-base font-oswald font-bold leading-tight">Command Center</p>
            <p className="text-[11px] text-gray-400">Digital Passport</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? router.pathname === '/admin' : router.pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Nothing until the session loads, so the role is never shown wrongly */}
          {status === 'authenticated' && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{session?.user?.name}</p>
              <p className="text-[11px] text-gray-400">{isSuper ? 'Super admin · all events' : 'Event admin'}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ redirect: false }).then(() => router.push('/login'))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
