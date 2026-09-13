import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Settings, ArrowLeft, Bell, Lock, Eye, Save, X } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    scanMode: 'UNLIMITED',
    enableNotifications: true,
    enableLeaderboard: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [status, router])

  const handleSave = async () => {
    try {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-xs text-gray-400">Configure event preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Success Message */}
        {saved && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            Settings saved successfully!
          </div>
        )}

        {/* Scan Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scan Settings</h2>
              <p className="text-sm text-gray-400 mt-1">Control how participants can scan zones</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">Scan Mode</label>
              <div className="space-y-3">
                {[
                  { value: 'ONE_SCAN', label: 'One Scan Only', desc: 'Each participant can scan each zone only once' },
                  { value: 'DAILY', label: 'Once Per Day', desc: 'Participants can scan each zone once per day' },
                  { value: 'UNLIMITED', label: 'Unlimited', desc: 'Participants can scan zones multiple times' },
                ].map((option) => (
                  <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      value={option.value}
                      checked={settings.scanMode === option.value}
                      onChange={(e) => setSettings({ ...settings, scanMode: e.target.value })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-gray-400">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Feature Settings</h2>
              <p className="text-sm text-gray-400 mt-1">Enable or disable platform features</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'enableNotifications', label: 'Notifications', desc: 'Send notifications to participants' },
              { key: 'enableLeaderboard', label: 'Leaderboard', desc: 'Display participant rankings' },
            ].map((option) => (
              <div key={option.key} className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-gray-400">{option.desc}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, [option.key]: !settings[option.key as keyof typeof settings] })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings[option.key as keyof typeof settings] ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings[option.key as keyof typeof settings] ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-lg transition-all font-semibold"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
          <Link href="/admin">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-all font-semibold">
              <X className="w-5 h-5" />
              Cancel
            </button>
          </Link>
        </div>

        {/* Admin Info Section */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Account Information</h2>
              <p className="text-sm text-gray-400 mt-1">Your admin account details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-gray-400 text-sm mb-1">Account Name</p>
              <p className="font-semibold">{session?.user?.name}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-gray-400 text-sm mb-1">Email Address</p>
              <p className="font-semibold">{session?.user?.email}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-gray-400 text-sm mb-1">Role</p>
              <p className="font-semibold">{session?.user?.role || 'Administrator'}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-gray-400 text-sm mb-1">Account Status</p>
              <p className="font-semibold text-green-400">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
