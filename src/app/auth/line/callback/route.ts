import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/line-connect?error=denied`)
  }

  // LINEのアクセストークンを取得
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${origin}/auth/line/callback`,
      client_id: process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    }),
  })

  if (!tokenRes.ok) {
    console.error('LINE token error:', await tokenRes.text())
    return NextResponse.redirect(`${origin}/line-connect?error=token`)
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  // LINEプロフィールを取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(`${origin}/line-connect?error=profile`)
  }

  const lineProfile = await profileRes.json()
  // { userId, displayName, pictureUrl, statusMessage }

  // ログイン中のユーザーに紐づけて保存
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      line_user_id: lineProfile.userId,
      line_display_name: lineProfile.displayName,
      line_picture_url: lineProfile.pictureUrl ?? null,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('LINE save error:', updateError.message)
    return NextResponse.redirect(`${origin}/line-connect?error=save`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
