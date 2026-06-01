import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
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

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID ?? '2010254888'

  // リクエストの実際のホストからURLを構築
  const headersList = await headers()
  const host = headersList.get('host') ?? 'aftersupport.vercel.app'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const siteUrl = `${proto}://${host}`
  const redirectUri = `${siteUrl}/auth/line/callback`

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=line_connect&scope=profile`

  return <LineConnectClient lineAuthUrl={lineAuthUrl} error={error} />
}
