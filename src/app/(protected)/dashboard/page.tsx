import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import DashboardClient from './DashboardClient'
import ChatWidget from '@/components/ChatWidget'
import LogoutButton from '@/components/auth/LogoutButton'
import '@/app/chance.css'

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

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-wrap">
        {/* Header */}
        <header className="dash-hdr">
          <button className="hdr-notif">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            お知らせ
          </button>

          <div className="hdr-user">
            <div className="hdr-av">{avatarLetter}</div>
            <span className="hdr-email">{user?.email}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--gy)' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <LogoutButton />
          </div>
        </header>

        {/* Main content */}
        <main className="dash-main">
          <DashboardClient firstName={firstName} />
        </main>
      </div>

      <ChatWidget />
    </div>
  )
}
