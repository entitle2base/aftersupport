import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import DashboardClient from './DashboardClient'
import ChatWidget from '@/components/ChatWidget'
import LogoutButton from '@/components/auth/LogoutButton'
import NotifButton from '@/components/NotifButton'
import '@/app/chance.css'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 全クエリを並列実行
  const [
    { data: profile },
    { data: steps },
    { data: videos },
    { data: watchLogs },
    { data: latestNotif },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabaseAdmin.from('video_steps').select('id, section, step_no, title, position').order('section').order('position'),
    supabaseAdmin.from('videos').select('id, step_id, position, title, description, video_key, emoji, bg_gradient, plus_alpha, tags, is_published').eq('is_published', true).order('step_id').order('position'),
    supabaseAdmin.from('video_watch').select('video_id').eq('student_id', user!.id),
    // 最新のbilling_monthで通知を取得（先月固定ではなく講師が送った最新月）
    supabaseAdmin.from('invoice_notifications').select('billing_month, notified_day1, notified_day5, notified_day8').eq('student_id', user!.id).order('billing_month', { ascending: false }).limit(1).maybeSingle(),
  ])

  const billingMonth = latestNotif?.billing_month ?? null

  // 通知がある場合は対応する請求書を取得
  const { data: invoice } = billingMonth
    ? await supabaseAdmin.from('invoices').select('status').eq('student_id', user!.id).eq('billing_month', billingMonth).maybeSingle()
    : { data: null }

  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'ゲスト'

  const avatarLetter = firstName.charAt(0).toUpperCase()
  const watchedIds = new Set((watchLogs ?? []).map(w => w.video_id as number))

  // Day 8以降・未送付の場合は請求書ページへ強制リダイレクト
  if (latestNotif?.notified_day8 && invoice?.status === 'pending') {
    redirect('/tools/invoice')
  }

  return (
    <div className="ds-layout">
      <Sidebar />
      <div className="ds-main-wrap">
        <header className="ds-dash-hdr">
          <NotifButton
            notifDay1={latestNotif?.notified_day1 ?? false}
            notifDay5={latestNotif?.notified_day5 ?? false}
            notifDay8={latestNotif?.notified_day8 ?? false}
            invoiceStatus={invoice?.status ?? null}
            billingMonth={billingMonth ?? ''}
          />
          <div className="ds-hdr-user">
            <div className="ds-hdr-av">{avatarLetter}</div>
            <span className="ds-hdr-email">{user?.email}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--ds-text-muted)' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <LogoutButton />
          </div>
        </header>
        <main className="ds-dash-main">
          <DashboardClient
            firstName={firstName}
            steps={steps ?? []}
            videos={videos ?? []}
            watchedIds={[...watchedIds]}
          />
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
