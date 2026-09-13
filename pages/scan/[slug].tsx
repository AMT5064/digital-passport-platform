import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Download, PlayCircle, Ticket, ExternalLink } from 'lucide-react'

interface ZoneData {
  zone: {
    id: string
    name: string
    description: string
    image: string
    points: number
  }
  activities: any[]
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
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({})

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

  const activity = zoneData?.activities?.[0]

  const handleCompleteActivity = async () => {
    if (!session?.user || !zoneData) return

    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`/api/scan/${slug}`, {
        completedAt: new Date().toISOString(),
        activityData: {
          type: activity?.type,
          quizAnswer,
          pollAnswer,
          surveyAnswers,
        },
        device: 'Web',
        browser: 'Web',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D] px-4">
        <div className="text-center">
          <h2 className="text-2xl font-oswald font-bold mb-4 text-white">Sign In Required</h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-6 py-2.5 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D]">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !zoneData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D] px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/passport')}
            className="bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] px-6 py-2.5 rounded-lg font-semibold transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D] px-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-8 text-center max-w-sm w-full">
          <CheckCircle2 className="w-14 h-14 text-[#00CBB3] mx-auto mb-4" />
          <h2 className="text-2xl font-oswald font-bold mb-2 text-white">Great Job!</h2>
          <p className="text-gray-300 mb-4 text-sm">
            You completed the activity at <strong>{zoneData.zone.name}</strong>
          </p>
          <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-[#FFB800]">
              +{zoneData.zone.points} Points
            </p>
          </div>
          <button
            onClick={() => router.push('/passport')}
            className="w-full bg-[#00CBB3] hover:bg-[#009B8A] text-[#16123D] py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins pb-8">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/passport">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-lg font-oswald font-bold truncate">{zoneData.event.name}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Zone Header */}
          <div className="p-5 bg-gradient-to-br from-[#00CBB3]/15 to-[#7600FF]/10 border-b border-white/10">
            <h2 className="text-xl font-oswald font-bold mb-1">{zoneData.zone.name}</h2>
            {zoneData.zone.description && <p className="text-gray-300 text-sm">{zoneData.zone.description}</p>}
          </div>

          {zoneData.zone.image && (
            <div className="h-40 bg-black/20 flex items-center justify-center">
              <img src={zoneData.zone.image} alt={zoneData.zone.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Activity Content */}
          <div className="p-5">
            {!activity && (
              <p className="text-gray-400 text-sm text-center py-4">Check in to this zone to earn points.</p>
            )}

            {activity?.type === 'QUIZ' && (
              <QuizActivity activity={activity} answer={quizAnswer} setAnswer={setQuizAnswer} />
            )}
            {activity?.type === 'POLL' && (
              <PollActivity activity={activity} answer={pollAnswer} setAnswer={setPollAnswer} />
            )}
            {activity?.type === 'SURVEY' && (
              <SurveyActivity activity={activity} answers={surveyAnswers} setAnswers={setSurveyAnswers} />
            )}
            {activity?.type === 'VIDEO' && <VideoActivity activity={activity} />}
            {activity?.type === 'RAFFLE' && <RaffleActivity activity={activity} />}
            {activity?.type === 'CUSTOM_CTA' && <CustomCTAActivity activity={activity} />}
            {activity?.type === 'DOWNLOAD' && <DownloadActivity activity={activity} />}

            <button
              onClick={handleCompleteActivity}
              disabled={submitting}
              className="w-full bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 text-[#16123D] py-3 rounded-lg font-semibold mt-6 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Complete Activity'}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          You will earn <strong className="text-[#FFB800]">{zoneData.zone.points} points</strong> for completing this activity
        </div>
      </div>
    </div>
  )
}

function QuizActivity({ activity, answer, setAnswer }: any) {
  return (
    <div>
      <h3 className="font-bold mb-3">{activity.question}</h3>
      <div className="space-y-2">
        {activity.answers?.map((opt: any) => (
          <label
            key={opt.id}
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              answer === opt.id ? 'border-[#00CBB3] bg-[#00CBB3]/10' : 'border-white/10 hover:bg-white/5'
            }`}
          >
            <input type="radio" name="quiz" value={opt.id} checked={answer === opt.id} onChange={(e) => setAnswer(e.target.value)} className="mr-3 accent-[#00CBB3]" />
            <span className="text-sm">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PollActivity({ activity, answer, setAnswer }: any) {
  return (
    <div>
      <h3 className="font-bold mb-3">{activity.question}</h3>
      <div className="space-y-2">
        {activity.pollOptions?.map((opt: any) => (
          <label
            key={opt.id}
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              answer === opt.id ? 'border-[#00CBB3] bg-[#00CBB3]/10' : 'border-white/10 hover:bg-white/5'
            }`}
          >
            <input type="radio" name="poll" value={opt.id} checked={answer === opt.id} onChange={(e) => setAnswer(e.target.value)} className="mr-3 accent-[#00CBB3]" />
            <span className="text-sm">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SurveyActivity({ activity, answers, setAnswers }: any) {
  const questions: string[] = activity.surveyQuestions || []
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={idx}>
          <label className="block text-sm font-semibold mb-2">{q}</label>
          <input
            type="text"
            value={answers[idx] || ''}
            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
            className="w-full px-3 py-2 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none"
            placeholder="Your answer..."
          />
        </div>
      ))}
    </div>
  )
}

function VideoActivity({ activity }: any) {
  return (
    <div>
      <h3 className="font-bold mb-3">{activity.title || 'Watch Video'}</h3>
      {activity.videoUrl ? (
        <a
          href={activity.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[#16123D]/60 border border-white/10 rounded-lg p-4 hover:border-[#00CBB3]/40 transition-colors"
        >
          <PlayCircle className="w-8 h-8 text-[#00CBB3] flex-shrink-0" />
          <span className="text-sm truncate">{activity.videoUrl}</span>
        </a>
      ) : (
        <p className="text-gray-400 text-sm">Video coming soon.</p>
      )}
    </div>
  )
}

function RaffleActivity({ activity }: any) {
  return (
    <div className="text-center py-2">
      <Ticket className="w-10 h-10 text-[#F96A32] mx-auto mb-3" />
      <h3 className="font-bold mb-1">{activity.raffleName || 'Raffle Entry'}</h3>
      {activity.rafflePrize && <p className="text-gray-300 text-sm">Prize: {activity.rafflePrize}</p>}
      <p className="text-gray-400 text-xs mt-2">Complete this activity to be entered!</p>
    </div>
  )
}

function CustomCTAActivity({ activity }: any) {
  return (
    <div>
      {activity.title && <h3 className="font-bold mb-3">{activity.title}</h3>}
      {activity.ctaUrl && (
        <a
          href={activity.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#00CBB3]/10 border border-[#00CBB3]/30 text-[#00CBB3] rounded-lg p-3 font-semibold text-sm hover:bg-[#00CBB3]/20 transition-colors"
        >
          {activity.ctaButtonText || 'Visit Link'}
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}

function DownloadActivity({ activity }: any) {
  return (
    <div>
      <h3 className="font-bold mb-3">{activity.title || 'Download'}</h3>
      {activity.downloadUrl && (
        <a
          href={activity.downloadUrl}
          download
          className="flex items-center gap-3 bg-[#16123D]/60 border border-white/10 rounded-lg p-4 hover:border-[#00CBB3]/40 transition-colors"
        >
          <Download className="w-6 h-6 text-[#00CBB3] flex-shrink-0" />
          <span className="text-sm truncate">{activity.downloadName || 'Download file'}</span>
        </a>
      )}
    </div>
  )
}
