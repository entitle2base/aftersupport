import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const LINE_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID ?? '2010254888'
const LINE_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET!
const LINE_REDIRECT_URI = 'https://aftersupport.vercel.app/auth/line/callback'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const lineError = searchParams.get('error')

  // ユーザーがキャンセルした場合
  if (lineError || !code) {
    return NextResponse.redirect(`${origin}/line-connect?error=denied`)
  }

  // ① LINEのアクセストークンを取得
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINE_REDIRECT_URI,
      client_id: LINE_CHANNEL_ID,
      client_secret: LINE_CHANNEL_SECRET,
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('[LINE] token exchange error:', errText)
    return NextResponse.redirect(`${origin}/line-connect?error=token`)
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  if (!accessToken) {
    console.error('[LINE] no access_token in response:', tokenData)
    return NextResponse.redirect(`${origin}/line-connect?error=token`)
  }

  // ② LINEプロフィールを取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!profileRes.ok) {
    console.error('[LINE] profile fetch error:', await profileRes.text())
    return NextResponse.redirect(`${origin}/line-connect?error=profile`)
  }

  const lineProfile = await profileRes.json()
  // { userId, displayName, pictureUrl }

  // ③ ログイン中のユーザーを確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // ④ adminクライアントでRLSを回避してDB保存
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
    console.error('[LINE] DB update error:', updateError.message)
    return NextResponse.redirect(`${origin}/line-connect?error=save`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
