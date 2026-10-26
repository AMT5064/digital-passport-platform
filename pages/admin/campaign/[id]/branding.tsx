import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Palette, Plus, X, Lock, CheckCircle2, AlertCircle, Copy, Smartphone, Monitor } from 'lucide-react'
import FileUpload from '@/components/admin/FileUpload'
import { contrastText } from '@/lib/utils'
import {
  CustomField,
  CustomFieldType,
  CUSTOM_FIELD_LABELS,
  FieldMode,
  LOCKED_FIELDS,
  RegistrationForm,
  STANDARD_FIELDS,
  defaultRegistrationForm,
} from '@/lib/registration'

// Banners are always shown at this shape, so phones, laptops and desktops all see the full image
const BANNER_WIDTH = 1600
const BANNER_HEIGHT = 600
const BANNER_RATIO = BANNER_WIDTH / BANNER_HEIGHT

const COLOR_PRESETS = ['#00CBB3', '#7600FF', '#F96A32', '#FFB800', '#E11D48', '#2563EB', '#16A34A', '#0F172A']

const PRESET_FIELDS: Omit<CustomField, 'id'>[] = [
  { label: 'City', type: 'TEXT', options: [], required: false },
  { label: 'LinkedIn profile', type: 'TEXT', options: [], required: false },
  { label: 'Industry', type: 'SELECT', options: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Other'], required: false },
  { label: 'I agree to be contacted about this event', type: 'CHECKBOX', options: [], required: true },
]

const uid = () => Math.random().toString(36).slice(2, 9)

const inputClass =
  'w-full px-4 py-3 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none focus:ring-2 focus:ring-[#00CBB3]/30 transition-all'
const smallInputClass =
  'w-full px-3 py-2 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none'
const sectionClass = 'bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4'

// Reads an image's pixel size so the banner shape can be checked before upload
const imageSize = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('Not a readable image'))
    img.src = url
  })

export default function BrandingPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId, new: isNew } = router.query

  const [eventName, setEventName] = useState('')
  const [banner, setBanner] = useState<{ url: string; name?: string; size?: number } | null>(null)
  const [logo, setLogo] = useState<{ url: string; name?: string; size?: number } | null>(null)
  const [themeColor, setThemeColor] = useState('#00CBB3')
  const [form, setForm] = useState<RegistrationForm>(defaultRegistrationForm())
  const [preview, setPreview] = useState<'phone' | 'desktop'>('phone')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!campaignId || status !== 'authenticated') return
    Promise.all([fetch('/api/events').then((r) => r.json()), fetch(`/api/registration-config?eventId=${campaignId}`).then((r) => r.json())])
      .then(([events, registration]) => {
        const event = Array.isArray(events) ? events.find((e: any) => e.id === campaignId) : null
        if (event) {
          setEventName(event.name)
          setThemeColor(event.themeColor || '#00CBB3')
          if (event.bannerImage) setBanner({ url: event.bannerImage, name: 'Current banner' })
          if (event.logo) setLogo({ url: event.logo, name: 'Current logo' })
        }
        if (registration?.fields) setForm(registration)
      })
      .catch(() => setError('Failed to load the event'))
      .finally(() => setLoading(false))
  }, [campaignId, status])

  const validateBanner = async (file: File) => {
    if (!file.type.startsWith('image/')) return 'Upload a PNG, JPG or WebP image'
    try {
      const { width, height } = await imageSize(file)
      if (width < 1200) return `The banner is ${width}×${height}px. Use at least 1200px wide, ideally ${BANNER_WIDTH}×${BANNER_HEIGHT}px.`
      const ratio = width / height
      if (Math.abs(ratio - BANNER_RATIO) / BANNER_RATIO > 0.1) {
        return `The banner is ${width}×${height}px. Use a ${BANNER_WIDTH}×${BANNER_HEIGHT}px image (8:3) so it isn't cropped on phones.`
      }
    } catch {
      return 'That file could not be read as an image'
    }
  }

  const validateLogo = async (file: File) => (file.type.startsWith('image/') ? undefined : 'Upload a PNG, JPG or WebP image')

  const setFieldMode = (key: keyof RegistrationForm['fields'], mode: FieldMode) =>
    setForm((f) => ({ ...f, fields: { ...f.fields, [key]: mode } }))
  const patchCustom = (id: string, patch: Partial<CustomField>) =>
    setForm((f) => ({ ...f, customFields: f.customFields.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  const addCustom = (field: Omit<CustomField, 'id'>) => setForm((f) => ({ ...f, customFields: [...f.customFields, { ...field, id: uid() }] }))
  const removeCustom = (id: string) => setForm((f) => ({ ...f, customFields: f.customFields.filter((c) => c.id !== id) }))

  const handleSave = async () => {
    setError('')
    for (const c of form.customFields) {
      if (!c.label.trim()) return setError('Every custom question needs a label')
      if (c.type === 'SELECT' && c.options.filter((o) => o.trim()).length < 2) return setError(`"${c.label}" needs at least two options`)
    }
    setSaving(true)
    try {
      const [eventRes, regRes] = await Promise.all([
        fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: campaignId, themeColor, bannerImage: banner?.url || null, logo: logo?.url || null }),
        }),
        fetch('/api/registration-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: campaignId, form }),
        }),
      ])
      if (!eventRes.ok || !regRes.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const registerLink = typeof window !== 'undefined' && campaignId ? `${window.location.origin}/register?event=${campaignId}` : ''

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-16">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/admin/campaign/${campaignId}`} className="text-[#00CBB3]" aria-label="Back to campaign">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Palette className="w-7 h-7 text-[#00CBB3]" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-oswald font-bold truncate">Branding & Registration</h1>
            <p className="text-xs text-gray-400 truncate">{eventName}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden sm:block bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 text-[#16123D] px-5 py-2.5 rounded-lg font-semibold"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6 min-w-0">
          {isNew && (
            <div className="p-4 bg-[#00CBB3]/15 border border-[#00CBB3]/40 rounded-lg text-sm text-[#00CBB3]">
              Event created. Next, give it its look and choose what attendees fill in when they register.
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          {saved && (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm font-medium">Branding and registration form saved</p>
            </div>
          )}

          {/* Banner */}
          <section className={sectionClass}>
            <div>
              <h2 className="text-lg font-oswald font-bold">Event banner</h2>
              <p className="text-sm text-gray-400 mt-1">
                Shown at the top of registration, booth and passport pages. Use a <strong className="text-white">{BANNER_WIDTH} × {BANNER_HEIGHT} px</strong> image
                (8:3). Keep text and logos in the middle area, away from the edges.
              </p>
            </div>
            <FileUpload
              accept="image/png,image/jpeg,image/webp"
              hint={`PNG, JPG or WebP, ${BANNER_WIDTH}×${BANNER_HEIGHT}px, up to 10 MB`}
              value={banner}
              onChange={setBanner}
              validate={validateBanner}
              showImage
            />
          </section>

          {/* Logo and colour */}
          <section className={sectionClass}>
            <h2 className="text-lg font-oswald font-bold">Logo & theme colour</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold mb-2">Logo (optional)</p>
                <p className="text-xs text-gray-400 mb-3">A square image, at least 256 × 256 px.</p>
                <FileUpload accept="image/png,image/jpeg,image/webp" hint="Square PNG with a transparent background works best" value={logo} onChange={setLogo} validate={validateLogo} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Theme colour</p>
                <p className="text-xs text-gray-400 mb-3">Used for buttons and highlights on attendee pages.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setThemeColor(c)}
                      aria-label={`Use colour ${c}`}
                      className={`w-9 h-9 rounded-full border-2 ${themeColor.toLowerCase() === c.toLowerCase() ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer bg-transparent" />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setThemeColor(e.target.value)}
                    className={smallInputClass + ' font-mono uppercase'}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Registration form */}
          <section className={sectionClass}>
            <div>
              <h2 className="text-lg font-oswald font-bold">Registration form</h2>
              <p className="text-sm text-gray-400 mt-1">Choose what attendees fill in. Shorter forms get more sign-ups at a busy booth.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Welcome message (optional)</label>
              <textarea
                value={form.welcomeText}
                onChange={(e) => setForm((f) => ({ ...f, welcomeText: e.target.value }))}
                rows={2}
                maxLength={240}
                className={inputClass + ' resize-none'}
                placeholder="e.g. Register to collect points at every booth and win prizes!"
              />
            </div>

            <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden">
              {LOCKED_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.02]">
                  <span className="text-sm">{f.label}</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock className="w-3.5 h-3.5" /> Always required
                  </span>
                </div>
              ))}
              {STANDARD_FIELDS.map((f) => (
                <div key={f.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm">{f.label}</span>
                  <div className="flex rounded-lg border border-white/15 overflow-hidden text-xs font-semibold">
                    {(['required', 'optional', 'hidden'] as FieldMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFieldMode(f.key, mode)}
                        className={`px-3 py-1.5 capitalize ${form.fields[f.key] === mode ? 'bg-[#00CBB3] text-[#16123D]' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        {mode === 'hidden' ? 'Off' : mode}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Custom questions</h3>
              <div className="space-y-3">
                {form.customFields.map((c) => (
                  <div key={c.id} className="p-3 border border-white/10 rounded-lg space-y-3 bg-white/[0.02]">
                    <div className="flex gap-2">
                      <input value={c.label} onChange={(e) => patchCustom(c.id, { label: e.target.value })} className={smallInputClass} placeholder="Question label" />
                      <button type="button" onClick={() => removeCustom(c.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg" aria-label="Remove question">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <select
                        value={c.type}
                        onChange={(e) => {
                          const type = e.target.value as CustomFieldType
                          patchCustom(c.id, { type, options: type === 'SELECT' && c.options.length < 2 ? ['', ''] : c.options })
                        }}
                        className={smallInputClass + ' sm:w-56'}
                      >
                        {Object.entries(CUSTOM_FIELD_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={c.required} onChange={(e) => patchCustom(c.id, { required: e.target.checked })} className="w-4 h-4 accent-[#00CBB3]" />
                        Required
                      </label>
                    </div>
                    {c.type === 'SELECT' && (
                      <div className="space-y-2 pl-3 border-l-2 border-white/10">
                        {c.options.map((o, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={o}
                              onChange={(e) => patchCustom(c.id, { options: c.options.map((x, j) => (j === i ? e.target.value : x)) })}
                              className={smallInputClass}
                              placeholder={`Option ${i + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => patchCustom(c.id, { options: c.options.filter((_, j) => j !== i) })}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                              aria-label="Remove option"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => patchCustom(c.id, { options: [...c.options, ''] })} className="flex items-center gap-1.5 text-[#00CBB3] text-sm font-semibold">
                          <Plus className="w-4 h-4" /> Add option
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => addCustom({ label: '', type: 'TEXT', options: [], required: false })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#00CBB3]/50 text-[#00CBB3] text-xs font-semibold hover:bg-[#00CBB3]/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Add question
                </button>
                {PRESET_FIELDS.filter((p) => !form.customFields.some((c) => c.label === p.label)).map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => addCustom(p)}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-gray-300 text-xs hover:border-white/30"
                  >
                    + {p.label.length > 28 ? 'Contact consent' : p.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {registerLink && (
            <section className={sectionClass}>
              <h2 className="text-lg font-oswald font-bold">Registration link</h2>
              <p className="text-sm text-gray-400">
                Share this link before the event. Attendees who scan a booth QR code see the same branded form automatically.
              </p>
              <div className="flex gap-2">
                <input readOnly value={registerLink} className={smallInputClass + ' font-mono'} />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(registerLink)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center gap-1.5 px-3 rounded-lg border border-white/20 text-sm whitespace-nowrap hover:bg-white/5"
                >
                  <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </section>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:hidden bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 text-[#16123D] py-3 rounded-lg font-semibold"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300">Attendee preview</h2>
            <div className="flex rounded-lg border border-white/15 overflow-hidden">
              {(['phone', 'desktop'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreview(p)}
                  aria-label={`${p} preview`}
                  className={`px-3 py-1.5 ${preview === p ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                >
                  {p === 'phone' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <div className={`mx-auto border-4 border-black/60 rounded-[1.75rem] overflow-hidden bg-[#16123D] ${preview === 'phone' ? 'max-w-[300px]' : 'max-w-full rounded-xl'}`}>
            <RegistrationPreview eventName={eventName} banner={banner?.url} logo={logo?.url} color={themeColor} form={form} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function RegistrationPreview({ eventName, banner, logo, color, form }: { eventName: string; banner?: string; logo?: string; color: string; form: RegistrationForm }) {
  const shown = STANDARD_FIELDS.filter((f) => form.fields[f.key] !== 'hidden')
  const field = (label: string, required: boolean) => (
    <div key={label}>
      <p className="text-[10px] text-gray-300 mb-1">
        {label} {required && <span style={{ color }}>*</span>}
      </p>
      <div className="h-7 rounded-md bg-white/10 border border-white/10" />
    </div>
  )
  return (
    <div className="text-white">
      {banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner} alt="" className="w-full aspect-[8/3] object-cover" />
      ) : (
        <div className="w-full aspect-[8/3] flex items-center justify-center text-[10px] text-gray-400" style={{ background: `linear-gradient(135deg, ${color}55, #201751)` }}>
          Banner {BANNER_WIDTH}×{BANNER_HEIGHT}
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={logo} alt="" className="w-8 h-8 rounded object-contain bg-white/10" />}
          <p className="font-oswald font-bold text-base leading-tight">{eventName || 'Your event'}</p>
        </div>
        {form.welcomeText && <p className="text-[11px] text-gray-300">{form.welcomeText}</p>}
        <div className="grid grid-cols-2 gap-2">
          {field('First name', true)}
          {field('Last name', true)}
        </div>
        {field('Email', true)}
        {field('Password', true)}
        {shown.map((f) => field(f.label, form.fields[f.key] === 'required'))}
        {form.customFields.map((c) =>
          c.type === 'CHECKBOX' ? (
            <p key={c.id} className="flex items-center gap-2 text-[10px] text-gray-300">
              <span className="w-3 h-3 rounded border border-white/40 inline-block" /> {c.label || 'Untitled'} {c.required && <span style={{ color }}>*</span>}
            </p>
          ) : (
            field(c.label || 'Untitled question', c.required)
          )
        )}
        <div className="h-9 rounded-md flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: color, color: contrastText(color) }}>
          Create account
        </div>
      </div>
    </div>
  )
}
