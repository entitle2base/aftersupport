import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const LINE_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID ?? '2010254888'
const LINE_CHANNEL_SECRET_FALLBACK = '10f208da08d0109dcc308596cd1919b6'
const LINE_REDIRECT_URI = 'https://aftersupport.vercel.app/auth/line/callback'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const lineError = searchParams.get('error')

  if (lineError || !code) {
    return NextResponse.redirect(`${origin}/line-connect?error=denied`)
  }

  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET ?? LINE_CHANNEL_SECRET_FALLBACK

  // ① トークン取得
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINE_REDIRECT_URI,
      client_id: LINE_CHANNEL_ID,
      client_secret: channelSecret,
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    const msg = encodeURIComponent(`token_error: ${errText}`)
    return NextResponse.redirect(`${origin}/line-connect?error=token&msg=${msg}`)
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  if (!accessToken) {
    const msg = encodeURIComponent(`no_token: ${JSON.stringify(tokenData)}`)
    return NextResponse.redirect(`${origin}/line-connect?error=token&msg=${msg}`)
  }

  // ② プロフィール取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!profileRes.ok) {
    const errText = await profileRes.text()
    const msg = encodeURIComponent(`profile_error: ${errText}`)
    return NextResponse.redirect(`${origin}/line-connect?error=profile&msg=${msg}`)
  }

  const lineProfile = await profileRes.json()

  // ③ ユーザー確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // ④ DB保存（adminクライアントでRLS回避）
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      line_user_id: lineProfile.userId,
      line_display_name: lineProfile.displayName,
      line_picture_url: lineProfile.pictureUrl ?? null,
    })
    .eq('id', user.id)

  if (updateError) {
    const msg = encodeURIComponent(`save_error: ${updateError.message}`)
    return NextResponse.redirect(`${origin}/line-connect?error=save&msg=${msg}`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
