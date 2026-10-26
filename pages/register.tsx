import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import { signIn } from 'next-auth/react'
import { UserPlus, Mail, Lock, User, Briefcase, Phone, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight, MapPin } from 'lucide-react'
import { contrastText, safeCallbackUrl } from '@/lib/utils'
import { RegistrationForm, STANDARD_FIELDS, StandardFieldKey, defaultRegistrationForm } from '@/lib/registration'

interface EventBranding {
  id: string
  name: string
  venue: string | null
  startDate: string
  endDate: string
  logo: string | null
  bannerImage: string | null
  themeColor: string
  registration: RegistrationForm
}

const FIELD_ICONS: Record<StandardFieldKey, React.ElementType> = { mobile: Phone, company: Briefcase, designation: Briefcase }

const inputClass = 'input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500'
const plainInputClass = 'input bg-white/5 border-white/20 text-white placeholder-gray-500'

export default function Register() {
  const router = useRouter()
  const eventId = typeof router.query.event === 'string' ? router.query.event : ''
  const callbackUrl = safeCallbackUrl(router.query.callbackUrl)

  const [event, setEvent] = useState<EventBranding | null>(null)
  const [eventLoading, setEventLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    company: '',
    designation: '',
  })
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // An event link (or a booth QR) brings that event's banner, colours and form
  useEffect(() => {
    if (!eventId) return
    setEventLoading(true)
    axios
      .get(`/api/public/events/${eventId}`)
      .then((res) => setEvent(res.data))
      .catch(() => setEvent(null))
      .finally(() => setEventLoading(false))
  }, [eventId])

  const form = event?.registration || defaultRegistrationForm()
  const color = event?.themeColor || '#00CBB3'
  const onColor = contrastText(color)
  const shownFields = STANDARD_FIELDS.filter((f) => form.fields[f.key] !== 'hidden')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match')
    if (formData.password.length < 8) return setError('Password must be at least 8 characters')
    for (const f of shownFields) {
      if (form.fields[f.key] === 'required' && !formData[f.key].trim()) return setError(`${f.label} is required`)
    }
    for (const c of form.customFields) {
      const value = answers[c.id]
      if (c.required && (c.type === 'CHECKBOX' ? value !== true : !String(value || '').trim())) return setError(`${c.label} is required`)
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        // Fields the event switched off are never sent
        ...Object.fromEntries(shownFields.map((f) => [f.key, formData[f.key] || undefined])),
        ...(event && { eventId: event.id, registrationData: answers }),
      })

      if (response.data.success) {
        setSuccess(true)
        // Sign straight in so a first-time attendee lands back on the booth they scanned
        const login = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })
        if (login?.ok) {
          router.push(callbackUrl || '/passport')
        } else {
          const params = new URLSearchParams({ message: 'Account created! Please sign in.' })
          if (callbackUrl) params.set('callbackUrl', callbackUrl)
          router.push(`/login?${params}`)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loginHref = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'
  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#201751] via-[#16123D] to-[#201751] flex justify-center px-0 sm:px-4 sm:py-10"
      style={event ? { backgroundImage: `linear-gradient(160deg, ${color}33 0%, #16123D 45%, #201751 100%)` } : undefined}
    >
      <div className="w-full max-w-xl relative z-10">
        {!event && (
          <Link href="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors my-6 mx-4 sm:mx-0 font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to home
          </Link>
        )}

        <div className="bg-gradient-to-br from-[#16123D]/80 to-[#201751]/80 backdrop-blur-xl border-white/10 sm:border sm:rounded-2xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0">
          {event?.bannerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.bannerImage} alt={event.name} className="w-full aspect-[8/3] object-cover" />
          )}

          <div className="p-6 sm:p-8 md:p-10">
            {/* Header */}
            {event ? (
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  {event.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.logo} alt="" className="w-12 h-12 rounded-lg object-contain bg-white/10 p-1 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-oswald font-bold text-white leading-tight">{event.name}</h1>
                    <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                      {event.venue && (
                        <>
                          <MapPin className="w-3 h-3" style={{ color }} /> {event.venue} ·{' '}
                        </>
                      )}
                      {formatDate(event.startDate)} – {formatDate(event.endDate)}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-4">{form.welcomeText || 'Create your digital passport to collect points at every booth.'}</p>
              </div>
            ) : (
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[#00CBB3] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <UserPlus className="w-7 h-7 text-[#16123D]" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Join Us</h1>
                <p className="text-gray-400">Create your account to start engaging</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-[#00CBB3]/15 border border-[#00CBB3]/50 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00CBB3] flex-shrink-0" />
                <p className="text-[#00CBB3] text-sm font-medium">Account created successfully!</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/15 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField id="firstName" label="First name" icon={User} value={formData.firstName} onChange={handleChange} required color={color} autoComplete="given-name" />
                <TextField id="lastName" label="Last name" icon={User} value={formData.lastName} onChange={handleChange} required color={color} autoComplete="family-name" />
              </div>
              <TextField id="email" type="email" label="Email address" icon={Mail} value={formData.email} onChange={handleChange} required color={color} placeholder="your@email.com" autoComplete="email" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField id="password" label="Password" value={formData.password} onChange={handleChange} show={showPassword} onToggle={() => setShowPassword(!showPassword)} color={color} hint="At least 8 characters" />
                <PasswordField id="confirmPassword" label="Confirm password" value={formData.confirmPassword} onChange={handleChange} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} color={color} />
              </div>

              {shownFields.map((f) => (
                <TextField
                  key={f.key}
                  id={f.key}
                  type={f.type}
                  label={f.label}
                  icon={FIELD_ICONS[f.key]}
                  value={formData[f.key]}
                  onChange={handleChange}
                  required={form.fields[f.key] === 'required'}
                  color={color}
                  placeholder={f.placeholder}
                />
              ))}

              {form.customFields.map((c) =>
                c.type === 'CHECKBOX' ? (
                  <label key={c.id} className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers[c.id] === true}
                      onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.checked }))}
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ accentColor: color }}
                    />
                    <span>
                      {c.label} {c.required && <span style={{ color }}>*</span>}
                    </span>
                  </label>
                ) : (
                  <div key={c.id} className="form-group">
                    <label htmlFor={`custom-${c.id}`} className="label text-white font-medium">
                      {c.label} {c.required ? <span style={{ color }}>*</span> : <span className="text-gray-500 font-normal text-xs">(optional)</span>}
                    </label>
                    {c.type === 'SELECT' ? (
                      <select
                        id={`custom-${c.id}`}
                        value={String(answers[c.id] || '')}
                        onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                        className={plainInputClass}
                      >
                        <option value="">Select...</option>
                        {c.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`custom-${c.id}`}
                        type="text"
                        value={String(answers[c.id] || '')}
                        onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                        className={plainInputClass}
                      />
                    )}
                  </div>
                )
              )}

              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-4 py-3.5 rounded-lg font-semibold shadow-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color, color: onColor }}
              >
                {loading ? 'Creating account...' : success ? 'Account created!' : event ? 'Create my passport' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Already have an account?{' '}
              <Link href={loginHref} className="font-medium" style={{ color }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  icon: React.ElementType
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  color: string
  type?: string
  placeholder?: string
  autoComplete?: string
}

function TextField({ id, label, icon: Icon, value, onChange, required, color, type = 'text', placeholder, autoComplete }: TextFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="label text-white font-medium">
        {label} {required ? <span style={{ color }}>*</span> : <span className="text-gray-500 font-normal text-xs">(optional)</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input id={id} name={id} type={type} value={value} onChange={onChange} required={required} className={inputClass} placeholder={placeholder} autoComplete={autoComplete} />
      </div>
    </div>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  show: boolean
  onToggle: () => void
  color: string
  hint?: string
}

function PasswordField({ id, label, value, onChange, show, onToggle, color, hint }: PasswordFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="label text-white font-medium">
        {label} <span style={{ color }}>*</span>
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete="new-password"
          className={inputClass + ' pr-10'}
          placeholder="••••••••"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
