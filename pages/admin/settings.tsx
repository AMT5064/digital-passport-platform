import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Settings, Save, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    scanMode: 'UNLIMITED',
    enableNotifications: true,
    enableLeaderboard: true,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AdminLayout title="Settings" description="Configure event settings">
      <div className="max-w-2xl">
        <div className="premium-card p-5 sm:p-6 space-y-6">
          {/* Scan Mode */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Scan Mode</label>
            <select
              value={settings.scanMode}
              onChange={(e) => setSettings({ ...settings, scanMode: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ONE_SCAN">One Scan Only (per zone per user)</option>
              <option value="DAILY">Daily (once per day per zone)</option>
              <option value="UNLIMITED">Unlimited Scans</option>
            </select>
            <p className="text-xs text-slate-500 mt-1.5">Determines how many times users can scan the same zone</p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            {/* Notifications */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Send email notifications for rewards and milestones</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${settings.enableNotifications ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.enableNotifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {/* Leaderboard */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Live Leaderboard</p>
                <p className="text-xs text-slate-500 mt-0.5">Display live leaderboard to participants</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableLeaderboard: !settings.enableLeaderboard })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${settings.enableLeaderboard ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.enableLeaderboard ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="border-t border-slate-100 pt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Save size={16} /> Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-fade-in">
                <CheckCircle2 size={16} /> Saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
