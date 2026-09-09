import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Link from 'next/link'
import {
  MapPin, Award, CheckCircle2, Loader2, AlertCircle,
  ArrowLeft, HelpCircle, BarChart2, FileText, Video,
  Gift, ExternalLink, Download,
} from 'lucide-react'

interface ZoneData {
  zone: { id: string; name: string; description: string; image: string; points: number }
  activity: any
  event: { id: string; name: string; themeColor: string }
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
      } catch {
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
        activityData: { type: zoneData.activity.type, quizAnswer, pollAnswer },
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <MapPin size={28} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-500 text-sm mb-6">Please sign in to participate in this activity.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error && !zoneData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <p className="text-slate-700 font-medium mb-6">{error}</p>
          <Link href="/passport" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-semibold text-sm">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!zoneData) return null

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="premium-card p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Great Job!</h2>
          <p className="text-slate-500 text-sm mb-5">
            You completed the activity at <strong className="text-slate-700">{zoneData.zone.name}</strong>
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
            <Award size={20} className="text-amber-600" />
            <span className="text-xl font-bold text-amber-700">+{zoneData.zone.points} Points</span>
          </div>
          <div>
            <Link href="/passport" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activityIcons: Record<string, any> = {
    QUIZ: HelpCircle, POLL: BarChart2, SURVEY: FileText,
    VIDEO: Video, RAFFLE: Gift, CUSTOM_CTA: ExternalLink, DOWNLOAD: Download,
  }
  const ActivityIcon = activityIcons[zoneData.activity?.type] || HelpCircle

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/passport" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="premium-card overflow-hidden">
          {/* Zone Header */}
          <div className="p-5 sm:p-6 text-white" style={{ backgroundColor: zoneData.event.themeColor }}>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <MapPin size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">{zoneData.event.name}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">{zoneData.zone.name}</h1>
            <p className="text-sm opacity-90">{zoneData.zone.description}</p>
          </div>

          {/* Zone Image */}
          {zoneData.zone.image && (
            <div className="h-44 bg-slate-100">
              <img src={zoneData.zone.image} alt={zoneData.zone.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Activity Content */}
          <div className="p-5 sm:p-6">
            {zoneData.activity && (
              <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <ActivityIcon size={16} />
                {zoneData.activity.type.replace(/_/g, ' ')} Activity
              </div>
            )}

            {zoneData.activity?.type === 'QUIZ' && (
              <QuizActivity activity={zoneData.activity} answer={quizAnswer} setAnswer={setQuizAnswer} />
            )}
            {zoneData.activity?.type === 'POLL' && (
              <PollActivity activity={zoneData.activity} answer={pollAnswer} setAnswer={setPollAnswer} />
            )}
            {zoneData.activity?.type === 'SURVEY' && <SurveyActivity activity={zoneData.activity} />}
            {zoneData.activity?.type === 'VIDEO' && <VideoActivity activity={zoneData.activity} />}
            {zoneData.activity?.type === 'RAFFLE' && <RaffleActivity activity={zoneData.activity} />}
            {zoneData.activity?.type === 'CUSTOM_CTA' && <CustomCTAActivity activity={zoneData.activity} />}
            {zoneData.activity?.type === 'DOWNLOAD' && <DownloadActivity activity={zoneData.activity} />}

            <button
              onClick={handleCompleteActivity}
              disabled={submitting}
              style={{ backgroundColor: zoneData.event.themeColor }}
              className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl hover:opacity-90 transition font-semibold text-sm mt-6 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Complete Activity
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          You will earn <strong className="text-slate-700">{zoneData.zone.points} points</strong> for completing this activity
        </p>
      </div>
    </div>
  )
}

function QuizActivity({ activity, answer, setAnswer }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{activity.question}</h3>
      <div className="space-y-2">
        {activity.answers?.map((opt: any) => (
          <label
            key={opt.id}
            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
              answer === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input type="radio" name="quiz" value={opt.id} checked={answer === opt.id} onChange={(e) => setAnswer(e.target.value)} className="accent-indigo-600" />
            <span className="text-sm text-slate-700">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PollActivity({ activity, answer, setAnswer }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{activity.question}</h3>
      <div className="space-y-2">
        {activity.pollOptions?.map((opt: any) => (
          <label
            key={opt.id}
            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
              answer === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input type="radio" name="poll" value={opt.id} checked={answer === opt.id} onChange={(e) => setAnswer(e.target.value)} className="accent-indigo-600" />
            <span className="text-sm text-slate-700">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SurveyActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">Survey</h3>
      <p className="text-sm text-slate-500 mb-4">{activity.question}</p>
      <div className="space-y-4">
        {activity.surveyQuestions?.map((q: any) => (
          <div key={q.id}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{q.question}</label>
            {q.type === 'rating' ? (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className="w-9 h-9 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-medium text-slate-600 transition-colors">
                    {n}
                  </button>
                ))}
              </div>
            ) : q.type === 'multiple_choice' ? (
              <div className="flex flex-wrap gap-2">
                {q.options?.map((opt: string) => (
                  <button key={opt} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm text-slate-600 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your answer..." />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Watch Video</h3>
      {activity.videoUrl ? (
        <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
          <video src={activity.videoUrl} controls className="w-full h-full" />
        </div>
      ) : (
        <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center">
          <Video size={32} className="text-slate-400" />
        </div>
      )}
    </div>
  )
}

function RaffleActivity({ activity }: any) {
  return (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
        <Gift size={28} className="text-purple-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">Raffle Entry</h3>
      <p className="text-sm text-slate-500">{activity.question || 'You are entered into our raffle draw!'}</p>
    </div>
  )
}

function CustomCTAActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Special Offer</h3>
      <a href={activity.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-medium text-sm">
        {activity.ctaButtonText || 'Learn More'} <ExternalLink size={16} />
      </a>
    </div>
  )
}

function DownloadActivity({ activity }: any) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Download</h3>
      <a href={activity.downloadUrl} download className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-medium text-sm">
        <Download size={16} /> Download {activity.downloadName || 'File'}
      </a>
    </div>
  )
}
