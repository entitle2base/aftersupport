import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId } = await req.json()
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })

  // upsertで重複を無視（同じ動画を複数回見ても1レコード）
  const { error } = await supabaseAdmin
    .from('video_watch')
    .upsert(
      { student_id: user.id, video_id: videoId, watched_at: new Date().toISOString() },
      { onConflict: 'student_id,video_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
