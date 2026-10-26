import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Link from 'next/link'
import { formatBytes } from '@/lib/upload'
import { contrastText } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, XCircle, Download, Ticket, ExternalLink, Star, PlayCircle } from 'lucide-react'

interface ZoneData {
  zone: { id: string; name: string; description: string; image: string; points: number }
  activities: any[]
  event: { id: string; name: string; themeColor: string; bannerImage: string | null; logo: string | null }
  completion: { pointsEarned: number; completedAt: string } | null
}

interface SurveyQuestion {
  id: string
  text: string
  type: 'TEXT' | 'PARAGRAPH' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'DROPDOWN' | 'RATING' | 'SCALE' | 'YES_NO'
  required?: boolean
  options?: { id: string; text: string }[]
}

interface Result {
  pointsEarned: number
  isCorrect: boolean | null
  correctAnswerText: string | null
  explanation: string | null
  pollResults: { total: number; options: { id: string; text: string; count: number; percent: number }[] } | null
}

type SurveyAnswers = Record<string, string | string[]>

const optionClass = (selected: boolean) =>
  `flex items-center p-3 border rounded-lg cursor-pointer transition-colors text-sm ${
    selected ? 'border-[#00CBB3] bg-[#00CBB3]/10' : 'border-white/10 hover:bg-white/5'
  }`

const fieldClass =
  'w-full px-3 py-2 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none'

export default function ScanPage() {
  const router = useRouter()
  const { slug } = router.query
  const { data: session, status } = useSession()
  const [zoneData, setZoneData] = useState<ZoneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [quizSel, setQuizSel] = useState<string[]>([])
  const [pollSel, setPollSel] = useState<string[]>([])
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({})

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
  const color = zoneData?.event.themeColor || '#00CBB3'
  const brandButton = { backgroundColor: color, color: contrastText(color) }
  const settings = activity?.settings || {}
  const quizMulti = settings.quizType === 'MULTIPLE'
  const pollMulti = settings.pollType === 'MULTIPLE'

  const validate = (): string => {
    if (!activity) return ''
    if (activity.type === 'QUIZ' && quizSel.length === 0) return 'Please select an answer'
    if (activity.type === 'POLL' && pollSel.length === 0) return 'Please select an option'
    if (activity.type === 'SURVEY') {
      const questions: SurveyQuestion[] = (activity.surveyQuestions || []).filter((q: any) => typeof q === 'object')
      for (const q of questions) {
        if (q.required === false) continue
        const answer = surveyAnswers[q.id]
        const answered = Array.isArray(answer) ? answer.length > 0 : !!answer
        if (!answered) return 'Please answer all required questions'
      }
    }
    return ''
  }

  const handleCompleteActivity = async () => {
    if (!session?.user || !zoneData) return

    const message = validate()
    if (message) {
      setValidationError(message)
      return
    }
    setValidationError('')
    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`/api/scan/${slug}`, {
        completedAt: new Date().toISOString(),
        activityData: {
          type: activity?.type,
          quizAnswer: quizMulti ? quizSel : quizSel[0],
          pollAnswer: pollMulti ? pollSel : pollSel[0],
          surveyAnswers,
        },
        device: 'Web',
        browser: 'Web',
      })

      if (response.data.success) {
        const d = response.data.data
        setResult({
          pointsEarned: d.scan.pointsEarned,
          isCorrect: d.isCorrect,
          correctAnswerText: d.correctAnswerText,
          explanation: d.explanation,
          pollResults: d.pollResults,
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete activity')
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = (list: string[], id: string, multi: boolean) =>
    multi ? (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]) : [id]

  if (status === 'unauthenticated') {
    // Bring the attendee back to this booth after they sign in or register
    const callbackUrl = encodeURIComponent(router.asPath)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D] px-4 py-8">
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl overflow-hidden text-center max-w-md w-full">
          {zoneData?.event.bannerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={zoneData.event.bannerImage} alt={zoneData.event.name} className="w-full aspect-[8/3] object-cover" />
          )}
          <div className="p-8">
          {zoneData && (
            <>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color }}>{zoneData.event.name}</p>
              <h2 className="text-2xl font-oswald font-bold mb-2 text-white">{zoneData.zone.name}</h2>
              <p className="text-gray-300 text-sm mb-6">
                Sign in to complete this booth and earn <strong className="text-[#FFB800]">{zoneData.zone.points} points</strong>.
              </p>
            </>
          )}
          {!zoneData && <h2 className="text-2xl font-oswald font-bold mb-6 text-white">Sign in to continue</h2>}
          <button
            onClick={() => router.push(zoneData ? `/register?event=${zoneData.event.id}&callbackUrl=${callbackUrl}` : `/register?callbackUrl=${callbackUrl}`)}
            className="w-full py-3 rounded-lg font-semibold transition-all hover:brightness-110 mb-3"
            style={brandButton}
          >
            First time here? Get your passport
          </button>
          <button
            onClick={() => router.push(`/login?callbackUrl=${callbackUrl}`)}
            className="w-full border border-white/20 hover:bg-white/5 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            I already have an account
          </button>
          </div>
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

  if (zoneData.completion && !result) {
    const earned = zoneData.completion.pointsEarned
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D] px-4 py-8">
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-8 text-center max-w-sm w-full">
          <CheckCircle2 className="w-14 h-14 text-[#00CBB3] mx-auto mb-4" />
          <h2 className="text-2xl font-oswald font-bold mb-2 text-white">Already completed</h2>
          <p className="text-gray-300 mb-4 text-sm">
            You completed <strong>{zoneData.zone.name}</strong> on {new Date(zoneData.completion.completedAt).toLocaleString()}.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <p className={`text-2xl font-bold ${earned > 0 ? 'text-[#FFB800]' : 'text-gray-400'}`}>
              {earned > 0 ? `+${earned} Points earned` : '0 Points earned'}
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

  if (result) {
    const graded = result.isCorrect !== null
    const isPoll = !!result.pollResults
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#201751] to-[#16123D] px-4 py-8">
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-8 text-center max-w-sm w-full">
          {graded && !result.isCorrect ? (
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          ) : (
            <CheckCircle2 className="w-14 h-14 text-[#00CBB3] mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-oswald font-bold mb-2 text-white">
            {graded ? (result.isCorrect ? 'Correct!' : 'Not Quite') : isPoll ? 'Thanks for voting!' : 'Great Job!'}
          </h2>
          <p className="text-gray-300 mb-4 text-sm">
            {graded && !result.isCorrect && result.correctAnswerText ? (
              <>The correct answer was <strong>{result.correctAnswerText}</strong></>
            ) : (
              <>You completed the activity at <strong>{zoneData.zone.name}</strong></>
            )}
          </p>

          {result.explanation && (
            <p className="text-gray-300 text-sm bg-white/5 border border-white/10 rounded-lg p-3 mb-4 text-left">{result.explanation}</p>
          )}

          {result.pollResults && (
            <div className="text-left mb-4 space-y-3">
              <p className="text-xs text-gray-400">{result.pollResults.total} {result.pollResults.total === 1 ? 'vote' : 'votes'} so far</p>
              {result.pollResults.options.map((o) => (
                <div key={o.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{o.text}</span>
                    <span className="text-gray-400">{o.percent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00CBB3] rounded-full" style={{ width: `${o.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`border rounded-lg p-4 mb-6 ${result.pointsEarned > 0 ? 'bg-[#FFB800]/10 border-[#FFB800]/30' : 'bg-white/5 border-white/10'}`}>
            <p className={`text-2xl font-bold ${result.pointsEarned > 0 ? 'text-[#FFB800]' : 'text-gray-400'}`}>
              {result.pointsEarned > 0 ? `+${result.pointsEarned} Points` : '0 Points'}
            </p>
          </div>
          <button
            onClick={() => router.push('/passport')}
            className="w-full py-3 rounded-lg font-semibold transition-all hover:brightness-110"
            style={brandButton}
          >
            See what&apos;s next
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

      {zoneData.event.bannerImage && (
        <div className="max-w-lg mx-auto sm:px-4 sm:pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoneData.event.bannerImage} alt={zoneData.event.name} className="w-full aspect-[8/3] object-cover sm:rounded-2xl" />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 bg-gradient-to-br from-[#00CBB3]/15 to-[#7600FF]/10 border-b border-white/10">
            <h2 className="text-xl font-oswald font-bold mb-1">{zoneData.zone.name}</h2>
            {zoneData.zone.description && <p className="text-gray-300 text-sm">{zoneData.zone.description}</p>}
          </div>

          {zoneData.zone.image && (
            <div className="h-40 bg-black/20 flex items-center justify-center">
              <img src={zoneData.zone.image} alt={zoneData.zone.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-5">
            {!activity && <p className="text-gray-400 text-sm text-center py-4">Check in to this zone to earn points.</p>}

            {activity?.type === 'QUIZ' && (
              <ChoiceQuestion
                question={activity.question}
                options={activity.answers}
                selected={quizSel}
                multi={quizMulti}
                hint={quizMulti ? 'Select all that apply' : undefined}
                onPick={(id) => { setQuizSel(toggle(quizSel, id, quizMulti)); setValidationError('') }}
              />
            )}
            {activity?.type === 'POLL' && (
              <ChoiceQuestion
                question={activity.question}
                options={activity.pollOptions}
                selected={pollSel}
                multi={pollMulti}
                hint={pollMulti ? 'Select all that apply' : undefined}
                onPick={(id) => { setPollSel(toggle(pollSel, id, pollMulti)); setValidationError('') }}
              />
            )}
            {activity?.type === 'SURVEY' && (
              <SurveyForm
                questions={(activity.surveyQuestions || []).map((q: any, i: number) =>
                  typeof q === 'string' ? { id: String(i), text: q, type: 'TEXT', required: true } : q
                )}
                answers={surveyAnswers}
                setAnswers={(a) => { setSurveyAnswers(a); setValidationError('') }}
              />
            )}
            {activity?.type === 'VIDEO' && <VideoBlock activity={activity} />}
            {activity?.type === 'RAFFLE' && <RaffleBlock activity={activity} />}
            {activity?.type === 'CUSTOM_CTA' && <CtaBlock activity={activity} />}
            {activity?.type === 'DOWNLOAD' && (
              <DownloadBlock activity={activity} submitting={submitting} onDownloaded={handleCompleteActivity} buttonStyle={brandButton} />
            )}

            {validationError && <p className="text-red-400 text-xs mt-3">{validationError}</p>}

            {/* A download completes itself when the attendee downloads the file */}
            {activity?.type !== 'DOWNLOAD' && (
              <button
                onClick={handleCompleteActivity}
                disabled={submitting}
                className="w-full disabled:opacity-50 py-3 rounded-lg font-semibold mt-6 transition-all hover:brightness-110"
                style={brandButton}
              >
                {submitting ? 'Submitting...' : activity?.type === 'QUIZ' ? 'Submit Answer' : activity?.type === 'POLL' ? 'Submit Vote' : 'Complete Activity'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          {activity?.type === 'QUIZ' ? (
            <>Answer correctly to earn <strong className="text-[#FFB800]">{zoneData.zone.points} points</strong></>
          ) : (
            <>You will earn <strong className="text-[#FFB800]">{zoneData.zone.points} points</strong> for completing this activity</>
          )}
        </div>
      </div>
    </div>
  )
}

function ChoiceQuestion({
  question,
  options,
  selected,
  multi,
  hint,
  onPick,
}: {
  question: string
  options: { id: string; text: string }[]
  selected: string[]
  multi: boolean
  hint?: string
  onPick: (id: string) => void
}) {
  return (
    <div>
      <h3 className="font-bold mb-1">{question}</h3>
      {hint && <p className="text-xs text-gray-400 mb-3">{hint}</p>}
      <div className={`space-y-2 ${hint ? '' : 'mt-3'}`}>
        {(options || []).map((opt) => (
          <label key={opt.id} className={optionClass(selected.includes(opt.id))}>
            <input
              type={multi ? 'checkbox' : 'radio'}
              checked={selected.includes(opt.id)}
              onChange={() => onPick(opt.id)}
              className="mr-3 accent-[#00CBB3]"
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SurveyForm({
  questions,
  answers,
  setAnswers,
}: {
  questions: SurveyQuestion[]
  answers: SurveyAnswers
  setAnswers: (a: SurveyAnswers) => void
}) {
  const setAnswer = (id: string, value: string | string[]) => setAnswers({ ...answers, [id]: value })
  const toggleMulti = (id: string, optId: string) => {
    const current = (answers[id] as string[]) || []
    setAnswer(id, current.includes(optId) ? current.filter((x) => x !== optId) : [...current, optId])
  }

  return (
    <div className="space-y-6">
      {questions.map((q, idx) => (
        <div key={q.id}>
          <label className="block text-sm font-semibold mb-2">
            {idx + 1}. {q.text}
            {q.required === false && <span className="text-gray-500 font-normal"> (optional)</span>}
          </label>

          {q.type === 'TEXT' && (
            <input type="text" value={(answers[q.id] as string) || ''} onChange={(e) => setAnswer(q.id, e.target.value)} className={fieldClass} placeholder="Your answer" />
          )}

          {q.type === 'PARAGRAPH' && (
            <textarea rows={4} value={(answers[q.id] as string) || ''} onChange={(e) => setAnswer(q.id, e.target.value)} className={fieldClass + ' resize-none'} placeholder="Your answer" />
          )}

          {q.type === 'SINGLE_CHOICE' && (
            <div className="space-y-2">
              {(q.options || []).map((o) => (
                <label key={o.id} className={optionClass(answers[q.id] === o.id)}>
                  <input type="radio" name={q.id} checked={answers[q.id] === o.id} onChange={() => setAnswer(q.id, o.id)} className="mr-3 accent-[#00CBB3]" />
                  {o.text}
                </label>
              ))}
            </div>
          )}

          {q.type === 'MULTIPLE_CHOICE' && (
            <div className="space-y-2">
              {(q.options || []).map((o) => {
                const on = ((answers[q.id] as string[]) || []).includes(o.id)
                return (
                  <label key={o.id} className={optionClass(on)}>
                    <input type="checkbox" checked={on} onChange={() => toggleMulti(q.id, o.id)} className="mr-3 accent-[#00CBB3]" />
                    {o.text}
                  </label>
                )
              })}
            </div>
          )}

          {q.type === 'DROPDOWN' && (
            <select value={(answers[q.id] as string) || ''} onChange={(e) => setAnswer(q.id, e.target.value)} className={fieldClass}>
              <option value="">Select an option</option>
              {(q.options || []).map((o) => (
                <option key={o.id} value={o.id}>{o.text}</option>
              ))}
            </select>
          )}

          {q.type === 'RATING' && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const on = Number(answers[q.id]) >= n
                return (
                  <button key={n} type="button" onClick={() => setAnswer(q.id, String(n))} className="p-1" aria-label={`${n} stars`}>
                    <Star className="w-8 h-8" fill={on ? '#FFB800' : 'none'} stroke={on ? '#FFB800' : '#6b7280'} />
                  </button>
                )
              })}
            </div>
          )}

          {q.type === 'SCALE' && (
            <div>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(q.id, String(n))}
                    className={`py-2 rounded text-xs font-semibold border transition-colors ${
                      answers[q.id] === String(n) ? 'border-[#00CBB3] bg-[#00CBB3]/20 text-[#00CBB3]' : 'border-white/10 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>
          )}

          {q.type === 'YES_NO' && (
            <div className="flex gap-3">
              {['Yes', 'No'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(q.id, opt)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    answers[q.id] === opt ? 'border-[#00CBB3] bg-[#00CBB3]/10 text-[#00CBB3]' : 'border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function videoEmbed(url: string): { kind: 'iframe' | 'file' | 'link'; src: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` }
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { kind: 'file', src: url }
  return { kind: 'link', src: url }
}

function VideoBlock({ activity }: any) {
  if (!activity.videoUrl) return <p className="text-gray-400 text-sm">Video coming soon.</p>
  const embed = videoEmbed(activity.videoUrl)
  return (
    <div>
      <h3 className="font-bold mb-3">{activity.title || 'Watch the video'}</h3>
      {embed.kind === 'iframe' && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe src={embed.src} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen title={activity.title || 'Video'} />
        </div>
      )}
      {embed.kind === 'file' && <video src={embed.src} controls playsInline className="w-full rounded-lg bg-black" />}
      {embed.kind === 'link' && (
        <a href={embed.src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#16123D]/60 border border-white/10 rounded-lg p-4 hover:border-[#00CBB3]/40 transition-colors">
          <PlayCircle className="w-8 h-8 text-[#00CBB3] flex-shrink-0" />
          <span className="text-sm truncate">{embed.src}</span>
        </a>
      )}
    </div>
  )
}

function RaffleBlock({ activity }: any) {
  const settings = activity.settings || {}
  return (
    <div className="text-center py-2">
      <Ticket className="w-10 h-10 text-[#F96A32] mx-auto mb-3" />
      <h3 className="font-bold mb-1">{activity.raffleName || 'Raffle Entry'}</h3>
      {activity.rafflePrize && <p className="text-gray-300 text-sm">Prize: {activity.rafflePrize}</p>}
      <p className="text-gray-400 text-xs mt-2">
        {settings.winnersCount > 1 ? `${settings.winnersCount} winners` : '1 winner'}
        {settings.drawDate ? ` drawn on ${new Date(settings.drawDate).toLocaleDateString()}` : ''}
      </p>
      <p className="text-gray-400 text-xs mt-1">Complete this activity to enter.</p>
    </div>
  )
}

function CtaBlock({ activity }: any) {
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
          {activity.ctaButtonText || 'Visit link'}
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}

function DownloadBlock({
  activity,
  submitting,
  onDownloaded,
  buttonStyle,
}: {
  activity: any
  submitting: boolean
  onDownloaded: () => void
  buttonStyle: React.CSSProperties
}) {
  const size = activity.settings?.fileSize
  return (
    <div>
      <h3 className="font-bold mb-3">{activity.title || 'Download'}</h3>
      {activity.downloadUrl && (
        <a
          href={activity.downloadUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          // The browser starts the download from the link; recording it awards the booth points
          onClick={() => !submitting && onDownloaded()}
          className="flex items-center gap-3 rounded-lg p-4 transition-all hover:brightness-110"
          style={buttonStyle}
        >
          <Download className="w-6 h-6 flex-shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold truncate">{submitting ? 'Saving your download...' : activity.downloadName || 'Download file'}</span>
            {size ? <span className="block text-xs opacity-80">{formatBytes(size)}</span> : null}
          </span>
        </a>
      )}
    </div>
  )
}
