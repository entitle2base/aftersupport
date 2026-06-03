import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Sidebar from '@/components/Sidebar'
import InvoiceClient from './InvoiceClient'
import '@/app/chance.css'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function InvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // プロフィールと最新通知を並列取得
  const [
    { data: profile },
    { data: latestNotif },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabaseAdmin.from('invoice_notifications').select('billing_month').eq('student_id', user!.id).order('billing_month', { ascending: false }).limit(1).maybeSingle(),
  ])

  // 最新の通知のbilling_monthを使う（先月固定ではなく講師が送った月）
  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const fallbackMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const billingMonth = latestNotif?.billing_month ?? fallbackMonth

  // 案件と請求書を並列取得
  const [
    { data: jobs },
    { data: invoice },
  ] = await Promise.all([
    supabaseAdmin.from('monthly_jobs').select('work_type, quantity, unit_price, total_amount, note').eq('student_id', user!.id).eq('billing_month', billingMonth).order('created_at'),
    supabaseAdmin.from('invoices').select('id, status, total_amount, submitted_at').eq('student_id', user!.id).eq('billing_month', billingMonth).maybeSingle(),
  ])

  const fullName = profile?.full_name ?? ''
  const email = user?.email ?? ''

  return (
    <div className="ds-layout">
      <Sidebar />
      <div className="ds-main-wrap">
        <main className="ds-dash-main">
          <InvoiceClient
            senderName={fullName}
            senderEmail={email}
            billingMonth={billingMonth}
            jobs={jobs ?? []}
            invoice={invoice ?? null}
          />
        </main>
      </div>
    </div>
  )
}
