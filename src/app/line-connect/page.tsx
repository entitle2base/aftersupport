import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LineConnectClient from './LineConnectClient'

export default async function LineConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // すでに連携済みならダッシュボードへ
  const { data: profile } = await supabase
    .from('profiles')
    .select('line_user_id, line_display_name')
    .eq('id', user.id)
    .single()

  if (profile?.line_user_id) redirect('/dashboard')

  const { error } = await searchParams

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUri = `${siteUrl}/auth/line/callback`

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=line_connect&scope=profile`

  return <LineConnectClient lineAuthUrl={lineAuthUrl} error={error} />
}
