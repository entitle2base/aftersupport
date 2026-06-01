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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'ゲスト'

  const avatarLetter = firstName.charAt(0).toUpperCase()

  // カリキュラムをDBから取得
  const { data: steps } = await supabaseAdmin
    .from('video_steps')
    .select('id, section, step_no, title, position')
    .order('section')
    .order('position')

  const { data: videos } = await supabaseAdmin
    .from('videos')
    .select('id, step_id, position, title, description, video_key, emoji, bg_gradient, plus_alpha, tags, is_published')
    .eq('is_published', true)
    .order('step_id')
    .order('position')

  // 視聴済みIDを取得
  const { data: watchLogs } = await supabaseAdmin
    .from('video_watch')
    .select('video_id')
    .eq('student_id', user!.id)

  const watchedIds = new Set((watchLogs ?? []).map(w => w.video_id as number))

  // 先月の請求月（先月分の案件 → 今月通知）
  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const { data: notification } = await supabaseAdmin
    .from('invoice_notifications')
    .select('notified_day1, notified_day5, notified_day8')
    .eq('student_id', user!.id)
    .eq('billing_month', prevMonth)
    .single()

  // 今月の請求書提出状況
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('status')
    .eq('student_id', user!.id)
    .eq('billing_month', prevMonth)
    .single()

  // Day 8以降・未送付の場合は請求書ページへ強制リダイレクト
  if (notification?.notified_day8 && invoice?.status === 'pending') {
    redirect('/tools/invoice')
  }

  return (
    <div className="ds-layout">
      <Sidebar />

      <div className="ds-main-wrap">
        {/* Header */}
        <header className="ds-dash-hdr">
          <NotifButton
            notifDay1={notification?.notified_day1 ?? false}
            notifDay5={notification?.notified_day5 ?? false}
            notifDay8={notification?.notified_day8 ?? false}
            invoiceStatus={invoice?.status ?? null}
            billingMonth={prevMonth}
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

        {/* Main content */}
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
