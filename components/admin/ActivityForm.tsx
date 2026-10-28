import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, X, AlertCircle, ChevronUp, ChevronDown, HelpCircle, BarChart3, ClipboardList, Gift, Download, PlayCircle, MousePointerClick, CheckCircle2 } from 'lucide-react'
import FileUpload from './FileUpload'

export type ActivityType = 'QUIZ' | 'POLL' | 'SURVEY' | 'RAFFLE' | 'DOWNLOAD' | 'VIDEO' | 'CUSTOM_CTA'
export type QuizType = 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE'
export type PollType = 'SINGLE' | 'MULTIPLE'
export type SurveyQuestionType =
  | 'TEXT'
  | 'PARAGRAPH'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'DROPDOWN'
  | 'RATING'
  | 'SCALE'
  | 'YES_NO'

export interface Choice {
  id: string
  text: string
  isCorrect?: boolean
}

export interface SurveyQuestion {
  id: string
  text: string
  type: SurveyQuestionType
  required: boolean
  options: Choice[]
}

interface FormState {
  zoneId: string
  type: ActivityType
  title: string
  description: string
  question: string
  quizType: QuizType
  explanation: string
  tfCorrect: 'true' | 'false'
  answers: Choice[]
  pollType: PollType
  showResults: boolean
  pollOptions: Choice[]
  surveyQuestions: SurveyQuestion[]
  downloadName: string
  downloadUrl: string
  downloadSource: 'UPLOAD' | 'LINK'
  downloadSize: number
  videoUrl: string
  videoDuration: string
  raffleName: string
  rafflePrize: string
  winnersCount: string
  drawDate: string
  ctaButtonText: string
  ctaUrl: string
}

const uid = () => Math.random().toString(36).slice(2, 9)

const ACTIVITY_TYPES: { value: ActivityType; label: string; hint: string; icon: React.ElementType }[] = [
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle, hint: 'A graded question. Correct answers earn points, wrong answers earn none.' },
  { value: 'POLL', label: 'Poll', icon: BarChart3, hint: 'An opinion question with no right or wrong answer. Everyone who votes earns points.' },
  { value: 'SURVEY', label: 'Survey', icon: ClipboardList, hint: 'Several questions: choice, rating, scale, text and more.' },
  { value: 'RAFFLE', label: 'Raffle', icon: Gift, hint: 'Attendees enter a prize draw when they complete it.' },
  { value: 'DOWNLOAD', label: 'Download', icon: Download, hint: 'Share a brochure, deck or PDF. Downloading completes it.' },
  { value: 'VIDEO', label: 'Video', icon: PlayCircle, hint: 'Show a YouTube, Vimeo or direct video.' },
  { value: 'CUSTOM_CTA', label: 'Custom CTA', icon: MousePointerClick, hint: 'A button that sends attendees to any link.' },
]

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  SINGLE: 'Single choice (one correct answer)',
  MULTIPLE: 'Multiple choice (several correct answers)',
  TRUE_FALSE: 'True / False',
}

const SURVEY_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  TEXT: 'Text box (short answer)',
  PARAGRAPH: 'Text box (long answer)',
  SINGLE_CHOICE: 'Single choice',
  MULTIPLE_CHOICE: 'Multiple choice (select many)',
  DROPDOWN: 'Dropdown',
  RATING: 'Rating (1 to 5 stars)',
  SCALE: 'Scale (0 to 10)',
  YES_NO: 'Yes / No',
}

const needsOptions = (t: SurveyQuestionType) => t === 'SINGLE_CHOICE' || t === 'MULTIPLE_CHOICE' || t === 'DROPDOWN'

const blankChoices = (n = 2, withCorrect = false): Choice[] =>
  Array.from({ length: n }, (_, i) => ({ id: uid(), text: '', ...(withCorrect ? { isCorrect: i === 0 } : {}) }))

const blankQuestion = (): SurveyQuestion => ({ id: uid(), text: '', type: 'TEXT', required: true, options: [] })

export const emptyState = (): FormState => ({
  zoneId: '',
  type: 'QUIZ',
  title: '',
  description: '',
  question: '',
  quizType: 'SINGLE',
  explanation: '',
  tfCorrect: 'true',
  answers: blankChoices(2, true),
  pollType: 'SINGLE',
  showResults: true,
  pollOptions: blankChoices(2),
  surveyQuestions: [blankQuestion()],
  downloadName: '',
  downloadUrl: '',
  downloadSource: 'UPLOAD',
  downloadSize: 0,
  videoUrl: '',
  videoDuration: '',
  raffleName: '',
  rafflePrize: '',
  winnersCount: '1',
  drawDate: '',
  ctaButtonText: '',
  ctaUrl: '',
})

// Builds form state from a saved activity, tolerating older records (plain-string survey questions).
export function stateFromActivity(a: any): FormState {
  const s = emptyState()
  const settings = a.settings || {}
  s.zoneId = a.zoneId || ''
  s.type = a.type || 'QUIZ'
  s.title = a.title || ''
  s.description = a.description || ''
  s.question = a.question || ''
  s.quizType = settings.quizType || 'SINGLE'
  s.explanation = settings.explanation || ''
  s.pollType = settings.pollType || 'SINGLE'
  s.showResults = settings.showResults !== false
  if (Array.isArray(a.answers) && a.answers.length > 0) {
    if (s.quizType === 'TRUE_FALSE') {
      s.tfCorrect = a.answers.find((x: any) => x.isCorrect)?.id === 'false' ? 'false' : 'true'
    } else {
      s.answers = a.answers
    }
  }
  if (Array.isArray(a.pollOptions) && a.pollOptions.length > 0) s.pollOptions = a.pollOptions
  if (Array.isArray(a.surveyQuestions) && a.surveyQuestions.length > 0) {
    s.surveyQuestions = a.surveyQuestions.map((q: any) =>
      typeof q === 'string'
        ? { id: uid(), text: q, type: 'TEXT', required: true, options: [] }
        : {
            id: q.id || uid(),
            text: q.text || '',
            type: q.type === 'CHECKBOX' ? 'MULTIPLE_CHOICE' : q.type || 'TEXT',
            required: q.required !== false,
            options: q.options || [],
          }
    )
  }
  s.downloadName = a.downloadName || ''
  s.downloadUrl = a.downloadUrl || ''
  // Files uploaded here are served from /api/assets; anything else is an external link
  s.downloadSource = !s.downloadUrl || s.downloadUrl.startsWith('/api/assets/') ? 'UPLOAD' : 'LINK'
  s.downloadSize = settings.fileSize || 0
  s.videoUrl = a.videoUrl || ''
  s.videoDuration = a.videoDuration ? String(a.videoDuration) : ''
  s.raffleName = a.raffleName || ''
  s.rafflePrize = a.rafflePrize || ''
  s.winnersCount = String(settings.winnersCount || 1)
  s.drawDate = settings.drawDate || ''
  s.ctaButtonText = a.ctaButtonText || ''
  s.ctaUrl = a.ctaUrl || ''
  return s
}

// Validates the form and converts it to the API payload. Returns an error message when something is missing.
export function buildPayload(s: FormState): { error?: string; payload?: any } {
  if (!s.zoneId) return { error: 'Select a zone' }
  if (!s.title.trim()) return { error: 'Enter a title' }

  const payload: any = {
    zoneId: s.zoneId,
    type: s.type,
    title: s.title.trim(),
    description: s.description.trim(),
  }
  const filled = (list: Choice[]) => list.filter((c) => c.text.trim()).map((c) => ({ ...c, text: c.text.trim() }))

  if (s.type === 'QUIZ') {
    if (!s.question.trim()) return { error: 'Enter the quiz question' }
    payload.question = s.question.trim()
    if (s.quizType === 'TRUE_FALSE') {
      payload.answers = [
        { id: 'true', text: 'True', isCorrect: s.tfCorrect === 'true' },
        { id: 'false', text: 'False', isCorrect: s.tfCorrect === 'false' },
      ]
    } else {
      const answers = filled(s.answers)
      if (answers.length < 2) return { error: 'Add at least two answer options' }
      if (!answers.some((a) => a.isCorrect)) return { error: 'Mark at least one answer as correct' }
      payload.answers = answers
    }
    payload.settings = { quizType: s.quizType, explanation: s.explanation.trim() }
  }

  if (s.type === 'POLL') {
    if (!s.question.trim()) return { error: 'Enter the poll question' }
    const options = filled(s.pollOptions)
    if (options.length < 2) return { error: 'Add at least two poll options' }
    payload.question = s.question.trim()
    payload.pollOptions = options.map(({ id, text }) => ({ id, text }))
    payload.settings = { pollType: s.pollType, showResults: s.showResults }
  }

  if (s.type === 'SURVEY') {
    const questions = s.surveyQuestions.filter((q) => q.text.trim())
    if (questions.length === 0) return { error: 'Add at least one survey question' }
    for (const q of questions) {
      if (needsOptions(q.type) && filled(q.options).length < 2) {
        return { error: `"${q.text.trim()}" needs at least two options` }
      }
    }
    payload.surveyQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text.trim(),
      type: q.type,
      required: q.required,
      options: needsOptions(q.type) ? filled(q.options).map(({ id, text }) => ({ id, text })) : [],
    }))
  }

  if (s.type === 'RAFFLE') {
    if (!s.raffleName.trim()) return { error: 'Enter the raffle name' }
    payload.raffleName = s.raffleName.trim()
    payload.rafflePrize = s.rafflePrize.trim()
    payload.settings = { winnersCount: Math.max(1, parseInt(s.winnersCount) || 1), drawDate: s.drawDate }
  }

  if (s.type === 'DOWNLOAD') {
    if (!s.downloadUrl.trim()) {
      return { error: s.downloadSource === 'UPLOAD' ? 'Upload the file attendees will download' : 'Enter the download link' }
    }
    payload.downloadName = s.downloadName.trim() || 'Download'
    payload.downloadUrl = s.downloadUrl.trim()
    payload.settings = { fileSize: s.downloadSource === 'UPLOAD' ? s.downloadSize : 0 }
  }

  if (s.type === 'VIDEO') {
    if (!s.videoUrl.trim()) return { error: 'Enter the video URL' }
    payload.videoUrl = s.videoUrl.trim()
    payload.videoDuration = s.videoDuration
  }

  if (s.type === 'CUSTOM_CTA') {
    if (!s.ctaButtonText.trim() || !s.ctaUrl.trim()) return { error: 'Enter both the button text and the link' }
    payload.ctaButtonText = s.ctaButtonText.trim()
    payload.ctaUrl = s.ctaUrl.trim()
  }

  return { payload }
}

const inputClass =
  'w-full px-4 py-3 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-base placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none focus:ring-2 focus:ring-[#00CBB3]/30 transition-all'
const smallInputClass =
  'w-full px-3 py-2 bg-[#16123D]/60 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#00CBB3] focus:outline-none transition-all'
const labelClass = 'block text-sm font-semibold text-white mb-2'
const panelClass = 'space-y-4 p-4 bg-white/5 rounded-lg border border-white/10'
const linkBtn = 'flex items-center gap-1.5 text-[#00CBB3] hover:text-[#1EDCC8] text-sm font-semibold'

interface Props {
  zones: any[]
  initial?: FormState
  submitLabel: string
  submittingLabel: string
  cancelHref: string
  onSubmit: (payload: any) => Promise<string | void>
  // When editing, the activity's own booth stays selectable
  currentActivityId?: string
}

export default function ActivityForm({ zones, initial, submitLabel, submittingLabel, cancelHref, onSubmit, currentActivityId }: Props) {
  const [s, setS] = useState<FormState>(initial || emptyState())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setS((prev) => ({ ...prev, [key]: value }))

  // Choice list helpers, shared by quiz answers and poll options
  const updateChoice = (key: 'answers' | 'pollOptions', id: string, patch: Partial<Choice>) =>
    set(key, s[key].map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const addChoice = (key: 'answers' | 'pollOptions') =>
    set(key, [...s[key], { id: uid(), text: '', ...(key === 'answers' ? { isCorrect: false } : {}) }])
  const removeChoice = (key: 'answers' | 'pollOptions', id: string) => set(key, s[key].filter((c) => c.id !== id))

  const markCorrect = (id: string) => {
    if (s.quizType === 'MULTIPLE') {
      set('answers', s.answers.map((a) => (a.id === id ? { ...a, isCorrect: !a.isCorrect } : a)))
    } else {
      set('answers', s.answers.map((a) => ({ ...a, isCorrect: a.id === id })))
    }
  }

  const changeQuizType = (quizType: QuizType) => {
    // Going back to single choice can leave several answers marked correct; keep only the first
    if (quizType === 'SINGLE') {
      let seen = false
      set('answers', s.answers.map((a) => {
        const keep = a.isCorrect && !seen
        if (a.isCorrect) seen = true
        return { ...a, isCorrect: keep }
      }))
    }
    set('quizType', quizType)
  }

  // Survey helpers
  const patchQuestion = (id: string, patch: Partial<SurveyQuestion>) =>
    set('surveyQuestions', s.surveyQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  const changeQuestionType = (id: string, type: SurveyQuestionType) => {
    const q = s.surveyQuestions.find((x) => x.id === id)
    if (!q) return
    patchQuestion(id, { type, options: needsOptions(type) && q.options.length < 2 ? blankChoices(2) : q.options })
  }
  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const next = [...s.surveyQuestions]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    set('surveyQuestions', next)
  }
  const updateQuestionOption = (qid: string, oid: string, text: string) => {
    const q = s.surveyQuestions.find((x) => x.id === qid)
    if (q) patchQuestion(qid, { options: q.options.map((o) => (o.id === oid ? { ...o, text } : o)) })
  }
  const addQuestionOption = (qid: string) => {
    const q = s.surveyQuestions.find((x) => x.id === qid)
    if (q) patchQuestion(qid, { options: [...q.options, { id: uid(), text: '' }] })
  }
  const removeQuestionOption = (qid: string, oid: string) => {
    const q = s.surveyQuestions.find((x) => x.id === qid)
    if (q) patchQuestion(qid, { options: q.options.filter((o) => o.id !== oid) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = buildPayload(s)
    if (result.error) {
      setError(result.error)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSubmitting(true)
    const failure = await onSubmit(result.payload)
    if (failure) {
      setError(failure)
      setSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const removeBtn = 'p-2 text-red-400 hover:bg-red-500/20 rounded-lg flex-shrink-0'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className={labelClass}>Booth <span className="text-red-400">*</span></label>
        <select value={s.zoneId} onChange={(e) => set('zoneId', e.target.value)} className={inputClass}>
          <option value="">Select a booth</option>
          {zones.map((z) => {
            // Each booth has one activity; booths that already have one are shown but can't be picked
            const taken = (z.activities || []).some((a: any) => a.id !== currentActivityId)
            return (
              <option key={z.id} value={z.id} disabled={taken}>
                {z.name} · {z.points} pts{taken ? ' (already has an activity)' : ''}
              </option>
            )
          })}
        </select>
        {zones.length === 0 && (
          <p className="text-sm text-yellow-400 mt-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> No booths yet. Add a booth first.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Activity Type <span className="text-red-400">*</span></label>
        <div role="radiogroup" aria-label="Activity type" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ACTIVITY_TYPES.map((t) => {
            const Icon = t.icon
            const selected = s.type === t.value
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set('type', t.value)}
                className={`relative text-left p-3 rounded-lg border transition-all ${
                  selected ? 'border-[#00CBB3] bg-[#00CBB3]/10 ring-2 ring-[#00CBB3]/30' : 'border-white/15 bg-[#16123D]/40 hover:border-white/30'
                }`}
              >
                {selected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-[#00CBB3]" />}
                <Icon className={`w-5 h-5 mb-2 ${selected ? 'text-[#00CBB3]' : 'text-gray-300'}`} />
                <p className="text-sm font-semibold text-white">{t.label}</p>
                <p className="text-xs text-gray-400 mt-1 leading-snug">{t.hint}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>Title <span className="text-red-400">*</span></label>
        <input type="text" value={s.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="Name this activity" />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea value={s.description} onChange={(e) => set('description', e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Optional. Shown to admins only." />
      </div>

      {/* QUIZ */}
      {s.type === 'QUIZ' && (
        <div className={panelClass}>
          <div>
            <label className={labelClass}>Question type</label>
            <select value={s.quizType} onChange={(e) => changeQuizType(e.target.value as QuizType)} className={inputClass}>
              {Object.entries(QUIZ_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Question</label>
            <input type="text" value={s.question} onChange={(e) => set('question', e.target.value)} className={inputClass} placeholder="What is your question?" />
          </div>

          {s.quizType === 'TRUE_FALSE' ? (
            <div>
              <label className={labelClass}>Correct answer</label>
              <div className="flex gap-3">
                {(['true', 'false'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('tfCorrect', v)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      s.tfCorrect === v ? 'border-[#00CBB3] bg-[#00CBB3]/10 text-[#00CBB3]' : 'border-white/10 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {v === 'true' ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>
                Answers ({s.quizType === 'MULTIPLE' ? 'tick every correct answer' : 'select the correct answer'})
              </label>
              <div className="space-y-2">
                {s.answers.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <input
                      type={s.quizType === 'MULTIPLE' ? 'checkbox' : 'radio'}
                      name="correct"
                      checked={!!a.isCorrect}
                      onChange={() => markCorrect(a.id)}
                      className="w-5 h-5 accent-[#00CBB3] flex-shrink-0"
                      title="Correct answer"
                    />
                    <input type="text" value={a.text} onChange={(e) => updateChoice('answers', a.id, { text: e.target.value })} className={inputClass} placeholder="Answer text" />
                    {s.answers.length > 2 && (
                      <button type="button" onClick={() => removeChoice('answers', a.id)} className={removeBtn}>
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addChoice('answers')} className={linkBtn + ' mt-3'}>
                <Plus className="w-4 h-4" /> Add answer
              </button>
            </div>
          )}

          <div>
            <label className={labelClass}>Explanation (optional)</label>
            <textarea value={s.explanation} onChange={(e) => set('explanation', e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Shown to the attendee after they answer" />
          </div>
        </div>
      )}

      {/* POLL */}
      {s.type === 'POLL' && (
        <div className={panelClass}>
          <div>
            <label className={labelClass}>Voting type</label>
            <select value={s.pollType} onChange={(e) => set('pollType', e.target.value as PollType)} className={inputClass}>
              <option value="SINGLE">Single choice (one vote)</option>
              <option value="MULTIPLE">Multiple choice (select many)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Question</label>
            <input type="text" value={s.question} onChange={(e) => set('question', e.target.value)} className={inputClass} placeholder="What would you like to ask?" />
          </div>
          <div>
            <label className={labelClass}>Options</label>
            <div className="space-y-2">
              {s.pollOptions.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input type="text" value={o.text} onChange={(e) => updateChoice('pollOptions', o.id, { text: e.target.value })} className={inputClass} placeholder="Option text" />
                  {s.pollOptions.length > 2 && (
                    <button type="button" onClick={() => removeChoice('pollOptions', o.id)} className={removeBtn}>
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addChoice('pollOptions')} className={linkBtn + ' mt-3'}>
              <Plus className="w-4 h-4" /> Add option
            </button>
          </div>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={s.showResults} onChange={(e) => set('showResults', e.target.checked)} className="w-4 h-4 accent-[#00CBB3]" />
            Show live results to the attendee after they vote
          </label>
        </div>
      )}

      {/* SURVEY */}
      {s.type === 'SURVEY' && (
        <div className={panelClass}>
          <label className={labelClass + ' mb-0'}>Questions</label>
          <div className="space-y-4">
            {s.surveyQuestions.map((q, idx) => (
              <div key={q.id} className="p-3 bg-[#16123D]/40 border border-white/10 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-5 flex-shrink-0">{idx + 1}.</span>
                  <input type="text" value={q.text} onChange={(e) => patchQuestion(q.id, { text: e.target.value })} className={smallInputClass} placeholder="Question text" />
                  <div className="flex flex-col flex-shrink-0">
                    <button type="button" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-white disabled:opacity-20" title="Move up">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveQuestion(idx, 1)} disabled={idx === s.surveyQuestions.length - 1} className="text-gray-400 hover:text-white disabled:opacity-20" title="Move down">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {s.surveyQuestions.length > 1 && (
                    <button type="button" onClick={() => set('surveyQuestions', s.surveyQuestions.filter((x) => x.id !== q.id))} className={removeBtn}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="pl-7 space-y-3">
                  <select value={q.type} onChange={(e) => changeQuestionType(q.id, e.target.value as SurveyQuestionType)} className={smallInputClass}>
                    {Object.entries(SURVEY_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>

                  {needsOptions(q.type) && (
                    <div className="space-y-2">
                      {q.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <input type="text" value={o.text} onChange={(e) => updateQuestionOption(q.id, o.id, e.target.value)} className={smallInputClass} placeholder="Option text" />
                          {q.options.length > 2 && (
                            <button type="button" onClick={() => removeQuestionOption(q.id, o.id)} className={removeBtn}>
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addQuestionOption(q.id)} className={linkBtn + ' !text-xs'}>
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                    </div>
                  )}

                  {q.type === 'RATING' && <p className="text-xs text-gray-500">Attendees pick 1 to 5 stars.</p>}
                  {q.type === 'SCALE' && <p className="text-xs text-gray-500">Attendees pick a number from 0 to 10, handy for NPS style questions.</p>}
                  {q.type === 'YES_NO' && <p className="text-xs text-gray-500">Attendees answer Yes or No.</p>}

                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={q.required} onChange={(e) => patchQuestion(q.id, { required: e.target.checked })} className="w-4 h-4 accent-[#00CBB3]" />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set('surveyQuestions', [...s.surveyQuestions, blankQuestion()])} className={linkBtn}>
            <Plus className="w-4 h-4" /> Add question
          </button>
        </div>
      )}

      {/* RAFFLE */}
      {s.type === 'RAFFLE' && (
        <div className={panelClass}>
          <div>
            <label className={labelClass}>Raffle name</label>
            <input type="text" value={s.raffleName} onChange={(e) => set('raffleName', e.target.value)} className={inputClass} placeholder="e.g. Grand Prize Draw" />
          </div>
          <div>
            <label className={labelClass}>Prize</label>
            <input type="text" value={s.rafflePrize} onChange={(e) => set('rafflePrize', e.target.value)} className={inputClass} placeholder="e.g. Wireless headphones" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Number of winners</label>
              <input type="number" min="1" value={s.winnersCount} onChange={(e) => set('winnersCount', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Draw date (optional)</label>
              <input type="date" value={s.drawDate} onChange={(e) => set('drawDate', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* DOWNLOAD */}
      {s.type === 'DOWNLOAD' && (
        <div className={panelClass}>
          <div className="flex gap-2">
            {(['UPLOAD', 'LINK'] as const).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setS((prev) => ({ ...prev, downloadSource: source, downloadUrl: '', downloadSize: 0 }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  s.downloadSource === source ? 'border-[#00CBB3] bg-[#00CBB3]/10 text-white' : 'border-white/15 text-gray-300 hover:border-white/30'
                }`}
              >
                {source === 'UPLOAD' ? 'Upload a file' : 'Link to a file'}
              </button>
            ))}
          </div>
          {s.downloadSource === 'UPLOAD' ? (
            <div>
              <label className={labelClass}>File</label>
              <FileUpload
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.txt,.csv"
                hint="PDF, Word, PowerPoint, Excel, ZIP or image, up to 10 MB"
                value={s.downloadUrl ? { url: s.downloadUrl, name: s.downloadName, size: s.downloadSize } : null}
                onChange={(file) =>
                  setS((prev) => ({
                    ...prev,
                    downloadUrl: file?.url || '',
                    downloadSize: file?.size || 0,
                    downloadName: file ? prev.downloadName || file.name : prev.downloadName,
                  }))
                }
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>File link</label>
              <input type="url" value={s.downloadUrl} onChange={(e) => set('downloadUrl', e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
          )}
          <div>
            <label className={labelClass}>Name shown to attendees</label>
            <input type="text" value={s.downloadName} onChange={(e) => set('downloadName', e.target.value)} className={inputClass} placeholder="e.g. Product brochure" />
          </div>
          <p className="text-xs text-gray-400">Attendees earn the booth points as soon as they download the file.</p>
        </div>
      )}

      {/* VIDEO */}
      {s.type === 'VIDEO' && (
        <div className={panelClass}>
          <div>
            <label className={labelClass}>Video URL</label>
            <input type="url" value={s.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} className={inputClass} placeholder="YouTube, Vimeo or a direct .mp4 link" />
          </div>
          <div>
            <label className={labelClass}>Duration in seconds (optional)</label>
            <input type="number" min="0" value={s.videoDuration} onChange={(e) => set('videoDuration', e.target.value)} className={inputClass} placeholder="e.g. 120" />
          </div>
        </div>
      )}

      {/* CUSTOM CTA */}
      {s.type === 'CUSTOM_CTA' && (
        <div className={panelClass}>
          <div>
            <label className={labelClass}>Button text</label>
            <input type="text" value={s.ctaButtonText} onChange={(e) => set('ctaButtonText', e.target.value)} className={inputClass} placeholder="e.g. Visit our website" />
          </div>
          <div>
            <label className={labelClass}>Button link</label>
            <input type="url" value={s.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} className={inputClass} placeholder="https://..." />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-[#00CBB3] hover:bg-[#009B8A] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-semibold text-[#16123D] text-base shadow-lg"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className="flex-1">
          <button type="button" className="w-full bg-[#16123D] hover:bg-[#0f0c2e] px-6 py-3 rounded-lg transition-all font-semibold text-white text-base border border-white/20 hover:border-white/30">
            Cancel
          </button>
        </Link>
      </div>
    </form>
  )
}
