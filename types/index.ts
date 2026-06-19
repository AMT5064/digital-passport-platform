import { ReactNode } from 'react'

// Auth
export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ATTENDEE' | 'EVENT_ADMIN' | 'SUPER_ADMIN'
  image?: string | null
}

export interface Session {
  user?: AuthUser
  expires: string
}

// API Responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Event
export interface EventData {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  venue?: string
  logo?: string
  bannerImage?: string
  themeColor: string
  status: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
}

// Zone
export interface ZoneData {
  id: string
  name: string
  description?: string
  image?: string
  qrSlug: string
  eventId: string
  points: number
  active: boolean
  activity?: ActivityData
  createdAt: Date
  updatedAt: Date
}

// Activity
export interface ActivityData {
  id: string
  type: ActivityType
  zoneId: string
  eventId: string
  question?: string
  answers?: QuizAnswer[]
  pollOptions?: PollOption[]
  surveyQuestions?: SurveyQuestion[]
  downloadUrl?: string
  downloadName?: string
  videoUrl?: string
  videoDuration?: number
  ctaButtonText?: string
  ctaUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type ActivityType =
  | 'QUIZ'
  | 'POLL'
  | 'SURVEY'
  | 'DOWNLOAD'
  | 'VIDEO'
  | 'RAFFLE'
  | 'CUSTOM_CTA'

export interface QuizAnswer {
  id: string
  text: string
  isCorrect: boolean
}

export interface PollOption {
  id: string
  text: string
  votes?: number
}

export interface SurveyQuestion {
  id: string
  question: string
  type: 'text' | 'rating' | 'multiple_choice'
  options?: string[]
}

// Leaderboard
export interface LeaderboardEntry {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  points: number
  zonesCompleted: number
  activitiesCompleted: number
  rank: number
}

// Badge/Reward
export interface BadgeData {
  id: string
  name: string
  description?: string
  icon?: string
  eventId: string
  unlockedAt?: Date
}

export interface RewardData {
  id: string
  name: string
  description?: string
  icon?: string
  eventId: string
  pointsRequired?: number
  zonesRequired?: number
  activitiesRequired?: number
  unlockedAt?: Date
}

// Dashboard
export interface DashboardData {
  totalPoints: number
  currentRank: number
  zonesCompleted: number
  zonesTotal: number
  activitiesCompleted: number
  activitiesTotal: number
  badges: BadgeData[]
  nextReward?: RewardData
  recentActivity: ActivityLogData[]
}

// Activity Log
export interface ActivityLogData {
  id: string
  userId: string
  userName: string
  zoneId: string
  zoneName: string
  eventId: string
  action: string
  details?: any
  device: string
  browser: string
  ipAddress?: string
  createdAt: Date
}

// Analytics
export interface AnalyticsData {
  totalParticipants: number
  uniqueVisitors: number
  totalScans: number
  zoneStats: ZoneAnalytics[]
  activityStats: ActivityAnalytics[]
  hourlyTraffic: HourlyTrafficData[]
  leaderboardDistribution: number[]
  topZones: { zoneName: string; visits: number }[]
  topActivities: { activityType: string; completions: number }[]
}

export interface ZoneAnalytics {
  zoneId: string
  zoneName: string
  visits: number
  completionRate: number
  pointsAwarded: number
}

export interface ActivityAnalytics {
  activityType: ActivityType
  completions: number
  quizAttempts?: number
  correctAnswers?: number
}

export interface HourlyTrafficData {
  hour: string
  visits: number
  completions: number
}

// Scan
export interface ScanData {
  id: string
  userId: string
  zoneId: string
  eventId: string
  pointsEarned: number
  completedAt?: Date
  device: string
  browser: string
  ipAddress?: string
  createdAt: Date
}

// Component Props
export interface CardProps {
  className?: string
  children: ReactNode
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}
