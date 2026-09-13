import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import { UserPlus, Mail, Lock, User, Briefcase, Phone, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'

export default function Register() {
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

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile || undefined,
        company: formData.company || undefined,
        designation: formData.designation || undefined,
      })

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?message=Account created! Please sign in.')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8 font-medium">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="w-7 h-7 text-slate-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join Us</h1>
            <p className="text-gray-400">Create your account to start engaging</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/50 rounded-lg flex items-center gap-3 animate-slide-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">Account created successfully!</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/15 border border-red-500/50 rounded-lg flex items-gap-3 animate-slide-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="firstName" className="label text-white font-medium">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="label text-white font-medium">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="label text-white font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label text-white font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="label text-white font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Optional Fields */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors py-2">
                + Additional Information (Optional)
              </summary>
              <div className="space-y-4 pt-4 border-t border-white/10 mt-4">
                {/* Mobile */}
                <div className="form-group">
                  <label htmlFor="mobile" className="label text-white font-medium">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      id="mobile"
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="form-group">
                  <label htmlFor="company" className="label text-white font-medium">
                    Company
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      id="company"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                      placeholder="Your Company"
                    />
                  </div>
                </div>

                {/* Designation */}
                <div className="form-group">
                  <label htmlFor="designation" className="label text-white font-medium">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      id="designation"
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="input pl-10 bg-white/5 border-white/20 text-white placeholder-gray-500"
                      placeholder="Your Title"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="btn btn-primary w-full mt-8 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creating account...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Account Created!
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign In
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6">
            By creating an account, you agree to our <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms</a> and <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
