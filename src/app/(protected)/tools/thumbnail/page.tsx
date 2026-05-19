import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import ThumbnailClient from './ThumbnailClient'
import '@/app/chance.css'

export default async function ThumbnailPage() {
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

  return (
    <div>
      <header className="hdr">
        <div className="hdr-in">
          <Link href="/portal" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--dk)', letterSpacing: '-.01em' }}>
            アフターサポート
          </Link>
          <div className="hdr-r">
            <Link href="/dashboard" className="btn-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              ダッシュボード
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="av">{firstName.charAt(0).toUpperCase()}</div>
              <div className="u-text">
                <div className="u-nm">{profile?.full_name ?? user?.email}</div>
                <div className="u-rl">受講生</div>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="dash">
        <div className="d-welcome reveal">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg,var(--pk),var(--co))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-blue)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <h1 className="d-h1" style={{ fontSize: '22px' }}>サムネイル<em>AI添削</em></h1>
            </div>
          </div>
          <p className="d-sub">
            サムネイル画像をアップロードすると、AIが構図・文字・色などを分析してフィードバックします。
            講師に送る前に、まずAIで確認してみましょう。
          </p>
        </div>

        <ThumbnailClient />
      </main>
    </div>
  )
}
