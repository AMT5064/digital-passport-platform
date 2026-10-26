import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Users, Plus, Shield, ShieldCheck, X, AlertCircle, Copy, RefreshCw, Eye, EyeOff, Check } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'

interface Admin {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'EVENT_ADMIN'
  eventAccess: string[]
  isActive: boolean
  lastLoginAt: string | null
}

interface EventOption {
  id: string
  name: string
}

interface Draft {
  id?: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'SUPER_ADMIN' | 'EVENT_ADMIN'
  eventAccess: string[]
}

const emptyDraft = (): Draft => ({ firstName: '', lastName: '', email: '', password: '', role: 'EVENT_ADMIN', eventAccess: [] })

// Readable but strong: no look-alike characters
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(14))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

const inputClass =
  'w-full px-3 py-2.5 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none'

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [showPassword, setShowPassword] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const isSuper = session?.user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated' && !isSuper) router.push('/admin')
  }, [status, isSuper, router])

  const load = async () => {
    try {
      const [a, e] = await Promise.all([fetch('/api/admins').then((r) => r.json()), fetch('/api/events').then((r) => r.json())])
      setAdmins(Array.isArray(a) ? a : [])
      setEvents(Array.isArray(e) ? e.map((x: any) => ({ id: x.id, name: x.name })) : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && isSuper) load()
  }, [status, isSuper])

  const eventName = (id: string) => events.find((e) => e.id === id)?.name

  const save = async () => {
    if (!draft) return
    setError('')
    setSaving(true)
    try {
      const isNew = !draft.id
      const body = isNew
        ? draft
        : { id: draft.id, firstName: draft.firstName, lastName: draft.lastName, role: draft.role, eventAccess: draft.eventAccess, ...(draft.password && { password: draft.password }) }
      const res = await fetch('/api/admins', { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      if (isNew || draft.password) setCreated({ email: data.email, password: draft.password })
      setDraft(null)
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const update = async (id: string, patch: Partial<Admin>) => {
    setError('')
    const res = await fetch('/api/admins', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Failed to update')
    await load()
  }

  const remove = async (a: Admin) => {
    if (!confirm(`Remove ${a.firstName} ${a.lastName} (${a.email})? They will no longer be able to sign in.`)) return
    setError('')
    const res = await fetch('/api/admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id }) })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Failed to remove')
    await load()
  }

  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-12">
      <AdminHeader />
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#00CBB3]" />
            <div>
              <h1 className="text-2xl font-oswald font-bold">Team</h1>
              <p className="text-xs text-gray-400">Admins sign in at the normal login page with the email and password you set here.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setDraft({ ...emptyDraft(), password: generatePassword() })
              setCreated(null)
              setError('')
            }}
            className="flex items-center justify-center gap-2 bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-4 py-2.5 rounded-lg font-semibold"
          >
            <Plus className="w-5 h-5" /> Add admin
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {created && (
          <div className="p-5 bg-[#00CBB3]/10 border border-[#00CBB3]/40 rounded-xl space-y-3">
            <p className="font-semibold text-[#00CBB3] flex items-center gap-2">
              <Check className="w-5 h-5" /> Saved. Share these sign-in details privately; the password isn&apos;t shown again.
            </p>
            <pre className="text-sm bg-black/30 rounded-lg p-3 whitespace-pre-wrap break-all">{`Login: ${loginUrl}\nEmail: ${created.email}${created.password ? `\nPassword: ${created.password}` : ''}`}</pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Login: ${loginUrl}\nEmail: ${created.email}${created.password ? `\nPassword: ${created.password}` : ''}`)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-white/20 hover:bg-white/5"
            >
              <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy details'}
            </button>
          </div>
        )}

        {draft && (
          <section className="bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-oswald font-bold">{draft.id ? 'Edit admin' : 'New admin'}</h2>
              <button onClick={() => setDraft(null)} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">First name</label>
                <input className={inputClass} value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Last name</label>
                <input className={inputClass} value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  className={inputClass + (draft.id ? ' opacity-60' : '')}
                  type="email"
                  value={draft.email}
                  disabled={!!draft.id}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{draft.id ? 'New password (leave blank to keep)' : 'Password'}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className={inputClass + ' pr-10 font-mono'}
                      type={showPassword ? 'text' : 'password'}
                      value={draft.password}
                      onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400" aria-label="Show or hide password">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="button" onClick={() => setDraft({ ...draft, password: generatePassword() })} className="px-3 rounded-lg border border-white/20 hover:bg-white/5" title="Generate a strong password">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Access</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  { role: 'SUPER_ADMIN', icon: ShieldCheck, title: 'Full access', text: 'Every event, plus creating events and managing the team.' },
                  { role: 'EVENT_ADMIN', icon: Shield, title: 'Specific events', text: 'Only the events you tick below. Cannot create events or manage the team.' },
                ] as const).map((o) => (
                  <button
                    key={o.role}
                    type="button"
                    onClick={() => setDraft({ ...draft, role: o.role })}
                    className={`text-left p-4 rounded-lg border transition-colors ${draft.role === o.role ? 'border-[#00CBB3] bg-[#00CBB3]/10' : 'border-white/15 hover:border-white/30'}`}
                  >
                    <p className="font-semibold text-sm flex items-center gap-2">
                      <o.icon className="w-4 h-4 text-[#00CBB3]" /> {o.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{o.text}</p>
                  </button>
                ))}
              </div>
            </div>

            {draft.role === 'EVENT_ADMIN' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Events they can manage</label>
                {events.length === 0 ? (
                  <p className="text-sm text-gray-400">Create an event first, then give access to it here.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {events.map((e) => {
                      const checked = draft.eventAccess.includes(e.id)
                      return (
                        <label key={e.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${checked ? 'border-[#00CBB3]/60 bg-[#00CBB3]/5' : 'border-white/10'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setDraft({ ...draft, eventAccess: checked ? draft.eventAccess.filter((x) => x !== e.id) : [...draft.eventAccess, e.id] })
                            }
                            className="w-4 h-4 accent-[#00CBB3]"
                          />
                          <span className="text-sm">{e.name}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 text-[#16123D] px-5 py-2.5 rounded-lg font-semibold">
                {saving ? 'Saving...' : draft.id ? 'Save changes' : 'Create admin'}
              </button>
              <button onClick={() => setDraft(null)} className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5">
                Cancel
              </button>
            </div>
          </section>
        )}

        <section className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10">
          {admins.map((a) => {
            const me = a.id === session?.user?.id
            return (
              <div key={a.id} className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3 ${a.isActive ? '' : 'opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold flex flex-wrap items-center gap-2">
                    {a.firstName} {a.lastName} {me && <span className="text-xs text-gray-400">(you)</span>}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${a.role === 'SUPER_ADMIN' ? 'bg-[#00CBB3]/20 text-[#00CBB3]' : 'bg-[#7600FF]/25 text-[#C9A2FF]'}`}>
                      {a.role === 'SUPER_ADMIN' ? 'Full access' : 'Event admin'}
                    </span>
                    {!a.isActive && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">Disabled</span>}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{a.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.role === 'EVENT_ADMIN' && `Events: ${a.eventAccess.map(eventName).filter(Boolean).join(', ') || 'none'} · `}
                    {a.lastLoginAt ? `Last sign-in ${new Date(a.lastLoginAt).toLocaleString()}` : 'Never signed in'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setDraft({ id: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email, password: '', role: a.role, eventAccess: a.eventAccess })
                      setCreated(null)
                      setError('')
                    }}
                    className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15"
                  >
                    Edit
                  </button>
                  {!me && (
                    <>
                      <button onClick={() => update(a.id, { isActive: !a.isActive })} className="text-sm px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5">
                        {a.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => remove(a)} className="text-sm px-3 py-1.5 rounded-lg text-red-300 hover:bg-red-500/15">
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  )
}
