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
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    console.error('[callback] verifyOtp error:', JSON.stringify(error))
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // ログイン成功 → ユーザー情報取得
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // 既存プロフィールがあるか確認
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    // 初回ログイン：stripe_membersでStripe決済済みか確認
    const { data: stripeMember } = await supabaseAdmin
      .from('stripe_members')
      .select('subscription_status, stripe_customer_id')
      .eq('email', user.email)
      .single()

    // school_idを取得
    const { data: school } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('slug', 'chance')
      .single()

    // プロフィール作成（Stripe決済済みならactive、未決済はnull）
    await supabaseAdmin
      .from('profiles')
      .insert({
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
