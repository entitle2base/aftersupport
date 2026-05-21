import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const ALLOWED_KEYS = [
  'telop-3-elements.mp4',
  'premiere-screen-layout.mp4',
]

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key || !ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // アクティブなサブスク確認
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2時間有効な署名付きURL発行
  const { data, error } = await supabaseAdmin.storage
    .from('videos')
    .createSignedUrl(key, 60 * 60 * 2)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
