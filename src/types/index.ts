export type UserRole = 'student' | 'admin'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  school_id: string
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus | null
  created_at: string
}

export interface School {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Video {
  id: string
  school_id: string
  title: string
  description: string | null
  vimeo_id: string
  category: string
  tags: string[]
  order_index: number
  is_published: boolean
  duration_sec: number | null
  thumbnail_url: string | null
  created_at: string
}

export interface VideoProgress {
  id: string
  user_id: string
  video_id: string
  completed: boolean
  watch_seconds: number
  last_watched_at: string
}

export interface VideoLog {
  id: string
  user_id: string
  video_id: string
  watched_at: string
  watch_seconds: number
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface VideoCategory {
  id: string
  label: string
}
