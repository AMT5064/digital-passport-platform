import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState({
    scanMode: 'UNLIMITED',
    enableNotifications: true,
    enableLeaderboard: true,
  })

  const handleSave = () => {
    // In a real implementation, would save to database
    alert('Settings saved!')
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">⚙️ Settings</h1>
          <Link href="/admin">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Back
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Scan Mode */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Scan Mode
            </label>
            <select
              value={settings.scanMode}
              onChange={(e) => setSettings({ ...settings, scanMode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="ONE_SCAN">One Scan Only (per zone per user)</option>
              <option value="DAILY">Daily (once per day per zone)</option>
              <option value="UNLIMITED">Unlimited Scans</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Determines how many times users can scan the same zone
            </p>
          </div>

          {/* Enable Notifications */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                className="w-4 h-4 mr-3"
              />
              <span className="text-lg font-semibold text-gray-800">Enable Email Notifications</span>
            </label>
            <p className="text-sm text-gray-600 mt-2 ml-7">
              Send email notifications for rewards and milestones
            </p>
          </div>

          {/* Enable Leaderboard */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableLeaderboard}
                onChange={(e) => setSettings({ ...settings, enableLeaderboard: e.target.checked })}
                className="w-4 h-4 mr-3"
              />
              <span className="text-lg font-semibold text-gray-800">Enable Leaderboard</span>
            </label>
            <p className="text-sm text-gray-600 mt-2 ml-7">
              Display live leaderboard to participants
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold mt-8"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
