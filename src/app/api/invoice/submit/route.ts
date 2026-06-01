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

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

  // 請求書が本人のものかつ pending であることを確認
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('id, student_id, status')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 })
  if (invoice.student_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (invoice.status === 'submitted') return NextResponse.json({ error: 'すでに送付済みです' }, { status: 400 })
  if (invoice.status === 'paid') return NextResponse.json({ error: 'すでに支払済みです' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('invoices')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
