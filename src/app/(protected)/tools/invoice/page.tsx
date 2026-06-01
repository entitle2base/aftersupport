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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const fullName = profile?.full_name ?? ''
  const email = user?.email ?? ''

  // 今月の請求月（先月分案件が対象）
  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const billingMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  // 月次案件を取得（講師が入力したもの）
  const { data: jobs } = await supabaseAdmin
    .from('monthly_jobs')
    .select('work_type, quantity, unit_price, total_amount, note')
    .eq('student_id', user!.id)
    .eq('billing_month', billingMonth)
    .order('created_at')

  // 既存の請求書を確認
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('id, status, total_amount, submitted_at')
    .eq('student_id', user!.id)
    .eq('billing_month', billingMonth)
    .single()

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
