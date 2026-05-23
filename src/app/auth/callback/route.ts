import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  // PKCE フロー（codeパラメータ）
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }
    // パスワードリセット・招待リンク → パスワード設定画面へ
    if (type === 'recovery' || type === 'invite') {
      return NextResponse.redirect(`${origin}/update-password`)
    }
    return NextResponse.redirect(`${origin}/portal`)
  }

  // OTP / token_hash フロー
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      console.error('[callback] verifyOtp error:', JSON.stringify(error))
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    if (type === 'recovery' || type === 'invite') {
      return NextResponse.redirect(`${origin}/update-password`)
    }

    // マジックリンク（旧フロー）→ プロフィール確認してポータルへ
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      const { data: stripeMember } = await supabaseAdmin
        .from('stripe_members')
        .select('subscription_status, stripe_customer_id')
        .eq('email', user.email)
        .single()

      const { data: school } = await supabaseAdmin
        .from('schools')
        .select('id')
        .eq('slug', 'chance')
        .single()

      await supabaseAdmin.from('profiles').insert({
        id: user.id,
        email: user.email,
        role: 'student',
        school_id: school?.id ?? null,
        subscription_status: stripeMember?.subscription_status ?? null,
        stripe_customer_id: stripeMember?.stripe_customer_id ?? null,
      })
    }

    return NextResponse.redirect(`${origin}/portal`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
