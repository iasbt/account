export type Application = {
  id: string
  code: string
  name: string
  icon_url: string | null
  redirect_url: string
  auth_mode: 'cookie' | 'fragment' | string
}

export type UserAppAccess = {
  id: string
  user_id: string
  application_id: string
  last_accessed_at: string | null
  created_at: string | null
}
