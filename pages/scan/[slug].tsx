import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { ActivityType } from '@/types'

interface ZoneData {
  zone: {
    id: string
    name: string
    description: string
    image: string
    points: number
  }
  activity: any
  event: {
    id: string
    name: string
    themeColor: string
  }
}

export default function ScanPage() {
  const router = useRouter()
  const { slug } = router.query
  const { data: session, status } = useSession()
  const [zoneData, setZoneData] = useState<ZoneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')
  const [quizAnswer, setQuizAnswer] = useState('')
  const [pollAnswer, setPollAnswer] = useState('')

  useEffect(() => {
    if (!slug) return

    const fetchZone = async () => {
      try {
        const response = await axios.get(`/api/scan/${slug}`)
        if (response.data.success) {
          setZoneData(response.data.data)
        } else {
          setError('Zone not found')
        }
      } catch (err) {
        setError('Failed to load zone')
      } finally {
        setLoading(false)
      }
    }

    fetchZone()
  }, [slug])

  const handleCompleteActivity = async () => {
    if (!session?.user || !zoneData) return

    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`/api/scan/${slug}`, {
        completedAt: new Date().toISOString(),
        activityData: {
          type: zoneData.activity.type,
          quizAnswer,
          pollAnswer,
        },
        device: 'Mobile',
        browser: 'Chrome',
      })

      if (response.data.success) {
        setCompleted(true)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete activity')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading zone...</p>
        </div>
      </div>
    )
  }

  if (error && !zoneData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/passport')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!zoneData) return null

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Great Job!</h2>
          <p className="text-gray-600 mb-4">
            You completed the activity at <strong>{zoneData.zone.name}</strong>
          </p>
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-yellow-700">
              +{zoneData.zone.points} Points
            </p>
          </div>
          <button
            onClick={() => router.push('/passport')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 pt-8"
      style={{ backgroundColor: zoneData.event.themeColor + '20' }}
    >
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Zone Header */}
          <div
            className="p-6 text-white"
            style={{ backgroundColor: zoneData.event.themeColor }}
          >
            <h1 className="text-3xl font-bold mb-2">{zoneData.zone.name}</h1>
            <p className="opacity-90">{zoneData.zone.description}</p>
          </div>

          {/* Zone Image */}
          {zoneData.zone.image && (
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <img
                src={zoneData.zone.image}
                alt={zoneData.zone.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Activity Content */}
          <div className="p-6">
            {zoneData.activity?.type === 'QUIZ' && (
              <QuizActivity
                activity={zoneData.activity}
                answer={quizAnswer}
                setAnswer={setQuizAnswer}
              />
            )}

            {zoneData.activity?.type === 'POLL' && (
              <PollActivity
                activity={zoneData.activity}
                answer={pollAnswer}
                setAnswer={setPollAnswer}
              />
            )}

            {zoneData.activity?.type === 'SURVEY' && (
              <SurveyActivity activity={zoneData.activity} />
            )}

            {zoneData.activity?.type === 'VIDEO' && (
              <VideoActivity activity={zoneData.activity} />
            )}

            {zoneData.activity?.type === 'RAFFLE' && (
              <RaffleActivity activity={zoneData.activity} />
            )}

            {zoneData.activity?.type === 'CUSTOM_CTA' && (
              <CustomCTAActivity activity={zoneData.activity} />
            )}

            {zoneData.activity?.type === 'DOWNLOAD' && (
              <DownloadActivity activity={zoneData.activity} />
            )}

            {/* Submit Button */}
            <button
              onClick={handleCompleteActivity}
              disabled={submitting}
              style={{ backgroundColor: zoneData.event.themeColor }}
              className="w-full text-white py-3 rounded-lg hover:opacity-90 transition font-semibold mt-6 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Complete Activity'}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-gray-600">
          <p>
            You will earn <strong>{zoneData.zone.points} points</strong> for completing this
            activity
          </p>
        </div>
      </div>
    </div>
  )
}

function QuizActivity({ activity, answer, setAnswer }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{activity.question}</h3>
      <div className="space-y-2">
        {activity.answers?.map((opt: any) => (
          <label
            key={opt.id}
            className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="quiz"
              value={opt.id}
              checked={answer === opt.id}
              onChange={(e) => setAnswer(e.target.value)}
              className="mr-3"
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PollActivity({ activity, answer, setAnswer }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{activity.question}</h3>
      <div className="space-y-2">
        {activity.pollOptions?.map((opt: any) => (
          <label
            key={opt.id}
            className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="poll"
              value={opt.id}
              checked={answer === opt.id}
              onChange={(e) => setAnswer(e.target.value)}
              className="mr-3"
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SurveyActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Survey</h3>
      <p className="text-gray-600">Please fill out the survey questions</p>
    </div>
  )
}

function VideoActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Watch Video</h3>
      <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center mb-4">
        <span className="text-gray-500">Video player</span>
      </div>
    </div>
  )
}

function RaffleActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Raffle Entry</h3>
      <p className="text-gray-600">You are entered into our raffle draw!</p>
    </div>
  )
}

function CustomCTAActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Special Offer</h3>
      <a
        href={activity.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {activity.ctaButtonText}
      </a>
    </div>
  )
}

function DownloadActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Download</h3>
      <a
        href={activity.downloadUrl}
        download
        className="text-blue-600 hover:underline"
      >
        Download {activity.downloadName}
      </a>
    </div>
  )
}
