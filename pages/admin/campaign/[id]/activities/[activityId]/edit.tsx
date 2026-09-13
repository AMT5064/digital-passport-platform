import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Gamepad2, AlertCircle, Plus, X } from 'lucide-react'

type Answer = { id: string; text: string; isCorrect: boolean }
type PollOption = { id: string; text: string }

export default function EditActivityPage() {
  const { status } = useSession()
  const router = useRouter()
  const { id: campaignId, activityId } = router.query
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    zoneId: '',
    type: 'QUIZ',
    title: '',
    description: '',
    downloadUrl: '',
    downloadName: '',
    videoUrl: '',
    videoDuration: '',
    raffleName: '',
    rafflePrize: '',
    ctaButtonText: '',
    ctaUrl: '',
  })
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState<Answer[]>([
    { id: '1', text: '', isCorrect: true },
    { id: '2', text: '', isCorrect: false },
  ])
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ])
  const [surveyQuestions, setSurveyQuestions] = useState<string[]>([''])

  useEffect(() => {
    if (campaignId) fetchZones()
    if (activityId) fetchActivity()
  }, [campaignId, activityId])

  const fetchZones = async () => {
    try {
      const response = await fetch(`/api/zones?eventId=${campaignId}`)
      const data = await response.json()
      setZones(data)
    } catch (err) {
      console.error('Error fetching zones:', err)
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/activities?id=${activityId}`)
      const a = await response.json()
      setFormData({
        zoneId: a.zoneId || '',
        type: a.type || 'QUIZ',
        title: a.title || '',
        description: a.description || '',
        downloadUrl: a.downloadUrl || '',
        downloadName: a.downloadName || '',
        videoUrl: a.videoUrl || '',
        videoDuration: a.videoDuration ? String(a.videoDuration) : '',
        raffleName: a.raffleName || '',
        rafflePrize: a.rafflePrize || '',
        ctaButtonText: a.ctaButtonText || '',
        ctaUrl: a.ctaUrl || '',
      })
      setQuestion(a.question || '')
      if (a.answers && Array.isArray(a.answers) && a.answers.length > 0) setAnswers(a.answers)
      if (a.pollOptions && Array.isArray(a.pollOptions) && a.pollOptions.length > 0) setPollOptions(a.pollOptions)
      if (a.surveyQuestions && Array.isArray(a.surveyQuestions) && a.surveyQuestions.length > 0) setSurveyQuestions(a.surveyQuestions)
    } catch (err) {
      setError('Failed to load activity')
    } finally {
      setFetching(false)
    }
  }

  const addAnswer = () => setAnswers([...answers, { id: Date.now().toString(), text: '', isCorrect: false }])
  const removeAnswer = (id: string) => setAnswers(answers.filter((a) => a.id !== id))
  const updateAnswer = (id: string, text: string) => setAnswers(answers.map((a) => (a.id === id ? { ...a, text } : a)))
  const setCorrectAnswer = (id: string) => setAnswers(answers.map((a) => ({ ...a, isCorrect: a.id === id })))

  const addPollOption = () => setPollOptions([...pollOptions, { id: Date.now().toString(), text: '' }])
  const removePollOption = (id: string) => setPollOptions(pollOptions.filter((o) => o.id !== id))
  const updatePollOption = (id: string, text: string) => setPollOptions(pollOptions.map((o) => (o.id === id ? { ...o, text } : o)))

  const addSurveyQuestion = () => setSurveyQuestions([...surveyQuestions, ''])
  const removeSurveyQuestion = (idx: number) => setSurveyQuestions(surveyQuestions.filter((_, i) => i !== idx))
  const updateSurveyQuestion = (idx: number, value: string) => setSurveyQuestions(surveyQuestions.map((q, i) => (i === idx ? value : q)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.zoneId || !formData.type || !formData.title) {
        setError('Zone, activity type, and title are required')
        setLoading(false)
        return
      }

      const payload: any = {
        id: activityId,
        zoneId: formData.zoneId,
        type: formData.type,
        title: formData.title,
        description: formData.description || '',
      }

      if (formData.type === 'QUIZ') {
        payload.question = question
        payload.answers = answers.filter((a) => a.text.trim())
      } else if (formData.type === 'POLL') {
        payload.question = question
        payload.pollOptions = pollOptions.filter((o) => o.text.trim())
      } else if (formData.type === 'SURVEY') {
        payload.surveyQuestions = surveyQuestions.filter((q) => q.trim())
      } else if (formData.type === 'DOWNLOAD') {
        payload.downloadUrl = formData.downloadUrl
        payload.downloadName = formData.downloadName
      } else if (formData.type === 'VIDEO') {
        payload.videoUrl = formData.videoUrl
        payload.videoDuration = formData.videoDuration
      } else if (formData.type === 'RAFFLE') {
        payload.raffleName = formData.raffleName
        payload.rafflePrize = formData.rafflePrize
      } else if (formData.type === 'CUSTOM_CTA') {
        payload.ctaButtonText = formData.ctaButtonText
        payload.ctaUrl = formData.ctaUrl
      }

      const response = await fetch('/api/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update activity')
        setLoading(false)
        return
      }

      router.push(`/admin/campaign/${campaignId}?tab=activities`)
    } catch (err: any) {
      setError(err.message || 'Error updating activity')
      setLoading(false)
    }
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (!campaignId || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00CBB3]/30 border-t-[#00CBB3] rounded-full animate-spin"></div>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none focus:ring-2 focus:ring-[#00CBB3]/30 transition-all"
  const labelClass = "block text-sm font-semibold text-white mb-3"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201751] to-[#16123D] text-white font-poppins">
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-40 bg-gradient-to-r from-[#16123D]/80 to-[#201751]/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/admin/campaign/${campaignId}`}>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-[#00CBB3]" />
            <div>
              <h1 className="text-2xl font-oswald font-bold">Edit Activity</h1>
              <p className="text-sm text-gray-400">Update activity details</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelClass}>Zone <span className="text-red-400">*</span></label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Activity Type <span className="text-red-400">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={inputClass}
              >
                <option value="QUIZ">Quiz</option>
                <option value="POLL">Poll</option>
                <option value="SURVEY">Survey</option>
                <option value="RAFFLE">Raffle</option>
                <option value="DOWNLOAD">Download</option>
                <option value="VIDEO">Video</option>
                <option value="CUSTOM_CTA">Custom CTA</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className={inputClass}
                placeholder="Enter activity title..."
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass + " resize-none"}
                rows={2}
                placeholder="Optional description..."
              />
            </div>

            {formData.type === 'QUIZ' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <label className={labelClass}>Question</label>
                  <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className={inputClass} placeholder="What is your question?" />
                </div>
                <div>
                  <label className={labelClass}>Answers (select the correct one)</label>
                  <div className="space-y-2">
                    {answers.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <input type="radio" name="correctAnswer" checked={a.isCorrect} onChange={() => setCorrectAnswer(a.id)} className="w-5 h-5 accent-[#00CBB3] flex-shrink-0" />
                        <input type="text" value={a.text} onChange={(e) => updateAnswer(a.id, e.target.value)} className={inputClass} placeholder="Answer text" />
                        {answers.length > 2 && (
                          <button type="button" onClick={() => removeAnswer(a.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg flex-shrink-0">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addAnswer} className="mt-3 flex items-center gap-2 text-[#00CBB3] hover:text-[#1EDCC8] text-sm font-semibold">
                    <Plus className="w-4 h-4" /> Add Answer
                  </button>
                </div>
              </div>
            )}

            {formData.type === 'POLL' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <label className={labelClass}>Question</label>
                  <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className={inputClass} placeholder="What would you like to ask?" />
                </div>
                <div>
                  <label className={labelClass}>Poll Options</label>
                  <div className="space-y-2">
                    {pollOptions.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <input type="text" value={o.text} onChange={(e) => updatePollOption(o.id, e.target.value)} className={inputClass} placeholder="Option text" />
                        {pollOptions.length > 2 && (
                          <button type="button" onClick={() => removePollOption(o.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg flex-shrink-0">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addPollOption} className="mt-3 flex items-center gap-2 text-[#00CBB3] hover:text-[#1EDCC8] text-sm font-semibold">
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                </div>
              </div>
            )}

            {formData.type === 'SURVEY' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <label className={labelClass}>Survey Questions</label>
                <div className="space-y-2">
                  {surveyQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="text" value={q} onChange={(e) => updateSurveyQuestion(idx, e.target.value)} className={inputClass} placeholder={`Question ${idx + 1}`} />
                      {surveyQuestions.length > 1 && (
                        <button type="button" onClick={() => removeSurveyQuestion(idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg flex-shrink-0">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addSurveyQuestion} className="flex items-center gap-2 text-[#00CBB3] hover:text-[#1EDCC8] text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
            )}

            {formData.type === 'DOWNLOAD' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <label className={labelClass}>Download File Name</label>
                  <input type="text" value={formData.downloadName} onChange={(e) => setFormData({ ...formData, downloadName: e.target.value })} className={inputClass} placeholder="e.g. Event Brochure.pdf" />
                </div>
                <div>
                  <label className={labelClass}>Download URL</label>
                  <input type="url" value={formData.downloadUrl} onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
              </div>
            )}

            {formData.type === 'VIDEO' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <label className={labelClass}>Video URL</label>
                  <input type="url" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className={inputClass} placeholder="https://youtube.com/... or direct video link" />
                </div>
                <div>
                  <label className={labelClass}>Duration (seconds)</label>
                  <input type="number" value={formData.videoDuration} onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })} className={inputClass} placeholder="e.g. 120" />
                </div>
              </div>
            )}

            {formData.type === 'RAFFLE' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <label className={labelClass}>Raffle Name</label>
                  <input type="text" value={formData.raffleName} onChange={(e) => setFormData({ ...formData, raffleName: e.target.value })} className={inputClass} placeholder="e.g. Grand Prize Draw" />
                </div>
                <div>
                  <label className={labelClass}>Prize</label>
                  <input type="text" value={formData.rafflePrize} onChange={(e) => setFormData({ ...formData, rafflePrize: e.target.value })} className={inputClass} placeholder="e.g. Wireless Headphones" />
                </div>
              </div>
            )}

            {formData.type === 'CUSTOM_CTA' && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <label className={labelClass}>Button Text</label>
                  <input type="text" value={formData.ctaButtonText} onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })} className={inputClass} placeholder="e.g. Visit Our Website" />
                </div>
                <div>
                  <label className={labelClass}>Button URL</label>
                  <input type="url" value={formData.ctaUrl} onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#00CBB3] to-[#00CBB3] hover:from-[#009B8A] hover:to-[#009B8A] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-[#16123D] text-base shadow-lg"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href={`/admin/campaign/${campaignId}`} className="flex-1">
                <button type="button" className="w-full bg-[#16123D] hover:bg-[#0f0c2e] px-6 py-3 rounded-lg transition-all font-semibold text-white text-base border border-white/20 hover:border-white/30">
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
