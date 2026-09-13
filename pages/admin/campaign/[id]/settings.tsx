import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Settings, Save, CheckCircle2 } from 'lucide-react'

export default function CampaignSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: campaignId } = router.query
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    scanMode: 'UNLIMITED',
    enableNotifications: true,
    enableLeaderboard: true,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (!campaignId) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/admin/campaign/${campaignId}`}>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Campaign Settings</h1>
              <p className="text-sm text-gray-400">Configure campaign preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {saved && (
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3 animate-slide-in">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm font-medium">Settings saved successfully!</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>Scan Settings</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-4">Scan Mode</label>
              <div className="space-y-3">
                {[
                  { value: 'ONE_SCAN', label: 'One Scan Only', desc: 'Each participant can scan each zone only once' },
                  { value: 'DAILY', label: 'Once Per Day', desc: 'Participants can scan each zone once per day' },
                  { value: 'UNLIMITED', label: 'Unlimited', desc: 'Participants can scan zones multiple times' },
                ].map((option) => (
                  <label key={option.value} className="flex items-start gap-3 p-4 rounded-lg border border-white/10 hover:border-white/30 cursor-pointer transition-all hover:bg-white/5">
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.scanMode === option.value}
                      onChange={(e) => setFormData({ ...formData, scanMode: e.target.value })}
                      className="mt-1 w-5 h-5 cursor-pointer accent-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-sm text-gray-400">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">Features</h2>

          <div className="space-y-4">
            {[
              { key: 'enableNotifications', label: 'Notifications', desc: 'Send notifications to participants' },
              { key: 'enableLeaderboard', label: 'Leaderboard', desc: 'Display participant rankings' },
            ].map((option) => (
              <div key={option.key} className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-white/30 transition-all hover:bg-white/5">
                <div>
                  <p className="font-medium text-white">{option.label}</p>
                  <p className="text-sm text-gray-400">{option.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, [option.key]: !formData[option.key as keyof typeof formData] })}
                  className={`relative w-14 h-8 rounded-full transition-all flex-shrink-0 ${
                    formData[option.key as keyof typeof formData] ? 'bg-green-600/70' : 'bg-gray-600/70'
                  } border border-white/20`}
                  role="switch"
                  aria-checked={Boolean(formData[option.key as keyof typeof formData])}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${
                      formData[option.key as keyof typeof formData] ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-white text-base"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
