import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import '@/app/chance.css'

export default async function PortalPage() {
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
    <div className="portal">
      <div className="portal-inner">
        {/* ヘッダー部分 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--pk-l)',
            border: '1px solid rgba(37,99,235,.15)',
            borderRadius: '50px',
            padding: '5px 14px',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--pk)',
            letterSpacing: '.06em',
            marginBottom: '16px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pk)', display: 'inline-block' }}></span>
            AFTER SUPPORT
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '800',
            color: 'var(--dk)',
            letterSpacing: '-.01em',
            marginBottom: '6px',
          }}>
            おかえりなさい、{firstName}さん
          </div>
          <div style={{ fontSize: '13px', color: 'var(--gy)', fontWeight: '400' }}>
            受講中のスクールを選んでください
          </div>
        </div>

        {/* メニューグリッド */}
        <div className="portal-grid">
          <Link href="/dashboard" className="portal-item" style={{ animation: 'portalIn .5s ease .05s both' }}>
            <div className="p-circle pc-edit">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <div className="p-label">動画編集</div>
          </Link>

          <div className="portal-item lk" style={{ animation: 'portalIn .5s ease .1s both' }}>
            <div className="p-circle pc-sns">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2H7a5 5 0 00-5 5v6a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z"/>
                <circle cx="12" cy="12" r="3"/>
                <circle cx="17.5" cy="6.5" r="1"/>
              </svg>
            </div>
            <div className="p-label">SNS運用</div>
            <div className="p-coming">準備中</div>
          </div>

          <div className="portal-item lk" style={{ animation: 'portalIn .5s ease .15s both' }}>
            <div className="p-circle pc-ai">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/><rect x="2" y="2" width="20" height="8" rx="2"/>
                <rect x="6" y="14" width="12" height="8" rx="2"/>
                <path d="M12 10v4"/>
              </svg>
            </div>
            <div className="p-label">AI活用</div>
            <div className="p-coming">準備中</div>
          </div>
        </div>
      </div>

      <div className="portal-ft">&copy; アフターサポート受講生専用 All Rights Reserved.</div>
    </div>
  )
}
