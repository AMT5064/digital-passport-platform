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
    <header className="border-b border-white/[0.06] backdrop-blur-md sticky top-0 z-40 bg-[#16123D]/85">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-[#00CBB3] rounded-lg flex items-center justify-center font-bold text-[#16123D] text-xs">DP</div>
          <span className="hidden md:block text-sm font-semibold text-white">Digital Passport</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? router.pathname === '/admin' : router.pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active ? 'bg-white/[0.08] text-white font-medium' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Nothing until the session loads, so the role is never shown wrongly */}
          {status === 'authenticated' && (
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-200 leading-tight">{session?.user?.name}</p>
              <p className="text-[11px] text-gray-500">{isSuper ? 'Super admin' : 'Event admin'}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ redirect: false }).then(() => router.push('/login'))}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
