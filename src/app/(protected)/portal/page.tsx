import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClearHashError from '@/components/ClearHashError'
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
    <div className="portal-dark-wrap">
      <ClearHashError />

      {/* 背景エフェクト */}
      <div className="portal-dark-orb portal-dark-orb1"/>
      <div className="portal-dark-orb portal-dark-orb2"/>
      <div className="portal-dark-orb portal-dark-orb3"/>

      <div className="portal-dark-inner">

        {/* ロゴバッジ */}
        <div className="portal-dark-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 22 20 2 20"/>
          </svg>
          AFTER SUPPORT
        </div>

        {/* ウェルカムメッセージ */}
        <h1 className="portal-dark-title">
          <span className="portal-dark-title-greeting">おかえりなさい、</span>
          <span className="portal-dark-title-name"><span className="portal-dark-name">{firstName}</span>さん</span>
        </h1>
        <p className="portal-dark-sub">受講中のサポートを選んでください</p>

        {/* カードグリッド */}
        <div className="portal-dark-grid">

          {/* 動画編集 - アクティブ */}
          <Link href="/dashboard" className="portal-dark-card portal-dark-card--active">
            <div className="portal-dark-card-glow"/>
            <div className="portal-dark-icon portal-dark-icon--blue">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
            </div>
            <div className="portal-dark-card-label">動画編集</div>
            <div className="portal-dark-status portal-dark-status--active">
              <span className="portal-dark-status-dot"/>
              受講中
            </div>
            <div className="portal-dark-card-btn">
              サポートに進む
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </Link>

          {/* SNS運用 - 準備中 */}
          <div className="portal-dark-card portal-dark-card--locked">
            <div className="portal-dark-icon portal-dark-icon--gray">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2H7a5 5 0 00-5 5v6a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z"/>
                <circle cx="12" cy="12" r="3"/>
                <circle cx="17.5" cy="6.5" r="1"/>
              </svg>
            </div>
            <div className="portal-dark-card-label portal-dark-card-label--dim">SNS運用</div>
            <div className="portal-dark-status portal-dark-status--coming">準備中</div>
          </div>

          {/* AI活用 - 準備中 */}
          <div className="portal-dark-card portal-dark-card--locked">
            <div className="portal-dark-icon portal-dark-icon--gray">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/><rect x="2" y="2" width="20" height="8" rx="2"/>
                <rect x="6" y="14" width="12" height="8" rx="2"/>
                <path d="M12 10v4"/>
              </svg>
            </div>
            <div className="portal-dark-card-label portal-dark-card-label--dim">AI活用</div>
            <div className="portal-dark-status portal-dark-status--coming">準備中</div>
          </div>
        </div>

        {/* セキュリティ注記 */}
        <div className="portal-dark-security">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div>
            <div className="portal-dark-security-title">AFTER SUPPORTは受講生限定のサポートです</div>
            <div className="portal-dark-security-sub">このサイトは、講座をご受講中の方のみご利用いただけます。</div>
          </div>
        </div>
      </div>

      <style>{`
        .portal-dark-wrap{
          min-height:100vh;min-height:100dvh;
          display:flex;align-items:center;justify-content:center;
          background:#060B1A;
          position:relative;overflow:hidden;
          padding:40px 20px;
        }
        .portal-dark-orb{position:absolute;border-radius:50%;pointer-events:none;animation:portalDarkOrb 20s ease-in-out infinite}
        .portal-dark-orb1{width:700px;height:700px;background:radial-gradient(circle,rgba(47,107,255,.13) 0%,transparent 65%);top:-250px;right:-200px}
        .portal-dark-orb2{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 65%);bottom:-150px;left:-150px;animation-duration:25s;animation-direction:reverse}
        .portal-dark-orb3{width:350px;height:350px;background:radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 65%);top:45%;left:35%;animation-duration:18s}
        @keyframes portalDarkOrb{0%,100%{transform:translate(0,0)}50%{transform:translate(24px,-24px)}}
        @keyframes portalCardIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}

        .portal-dark-inner{
          position:relative;z-index:1;
          width:100%;max-width:480px;
          display:flex;flex-direction:column;align-items:center;
          text-align:center;
        }
        .portal-dark-badge{
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(47,107,255,.12);
          border:1px solid rgba(47,107,255,.3);
          border-radius:50px;padding:8px 20px;
          font:700 12px var(--sans);color:#60A5FA;
          letter-spacing:.1em;margin-bottom:24px;
          animation:portalCardIn .5s ease both;
        }
        .portal-dark-title{
          font:800 26px/1.3 var(--sans);
          color:#FFFFFF;margin-bottom:8px;
          letter-spacing:-.02em;
          animation:portalCardIn .5s ease .05s both;
          display:flex;flex-direction:column;align-items:center;gap:2px;
        }
        .portal-dark-title-greeting{
          font-size:18px;font-weight:600;
          color:rgba(255,255,255,.7);
          letter-spacing:.01em;
        }
        .portal-dark-title-name{
          font-size:clamp(20px,6vw,30px);font-weight:800;
          word-break:break-all;overflow-wrap:anywhere;
          max-width:100%;text-align:center;
          line-height:1.2;
        }
        .portal-dark-name{color:#60A5FA}
        .portal-dark-sub{
          font:400 13px var(--sans);
          color:rgba(148,163,184,.7);
          margin-bottom:36px;
          animation:portalCardIn .5s ease .1s both;
        }

        .portal-dark-grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:14px;width:100%;
          margin-bottom:32px;
        }
        .portal-dark-card{
          position:relative;overflow:hidden;
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.08);
          border-radius:18px;padding:24px 16px 20px;
          display:flex;flex-direction:column;align-items:center;gap:12px;
          transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s;
          text-decoration:none;
          animation:portalCardIn .5s ease .15s both;
        }
        .portal-dark-card--active{
          border-color:rgba(47,107,255,.45);
          background:rgba(47,107,255,.06);
          box-shadow:0 0 30px rgba(47,107,255,.15),inset 0 1px 0 rgba(255,255,255,.06);
          cursor:pointer;
        }
        .portal-dark-card--active:hover{
          transform:translateY(-6px);
          box-shadow:0 12px 40px rgba(47,107,255,.3),0 0 30px rgba(47,107,255,.2),inset 0 1px 0 rgba(255,255,255,.08);
        }
        .portal-dark-card--locked{
          cursor:default;opacity:.55;
          animation-delay:.2s;
        }
        .portal-dark-card-glow{
          position:absolute;top:-30px;left:50%;transform:translateX(-50%);
          width:120px;height:60px;
          background:radial-gradient(ellipse,rgba(47,107,255,.3) 0%,transparent 70%);
          pointer-events:none;
        }
        .portal-dark-icon{
          width:72px;height:72px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .portal-dark-icon--blue{
          background:linear-gradient(145deg,#1D4ED8,#3B82F6);
          box-shadow:0 8px 24px rgba(37,99,235,.45);
        }
        .portal-dark-icon--gray{
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.08);
        }
        .portal-dark-card-label{
          font:700 13px var(--sans);color:#FFFFFF;
          letter-spacing:.02em;
        }
        .portal-dark-card-label--dim{color:rgba(255,255,255,.35)}
        .portal-dark-status{
          display:inline-flex;align-items:center;gap:5px;
          border-radius:50px;padding:3px 10px;
          font:600 10px var(--sans);letter-spacing:.04em;
        }
        .portal-dark-status--active{
          background:rgba(37,99,235,.2);
          border:1px solid rgba(59,130,246,.35);
          color:#93C5FD;
        }
        .portal-dark-status-dot{
          width:5px;height:5px;border-radius:50%;
          background:#60A5FA;
          animation:portalDot 2s ease-in-out infinite;
        }
        @keyframes portalDot{0%,100%{opacity:1}50%{opacity:.3}}
        .portal-dark-status--coming{
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);
          color:rgba(148,163,184,.5);
        }
        .portal-dark-card-btn{
          display:inline-flex;align-items:center;gap:5px;
          background:linear-gradient(135deg,#1D4ED8,#2F6BFF);
          color:#fff;font:700 11px var(--sans);
          border-radius:8px;padding:7px 14px;
          box-shadow:0 3px 12px rgba(47,107,255,.4);
          margin-top:2px;
        }

        .portal-dark-security{
          display:flex;align-items:flex-start;gap:10px;
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.07);
          border-radius:14px;padding:14px 18px;
          text-align:left;color:rgba(148,163,184,.5);
          animation:portalCardIn .5s ease .25s both;
          width:100%;
        }
        .portal-dark-security svg{flex-shrink:0;margin-top:2px}
        .portal-dark-security-title{
          font:600 11px var(--sans);
          color:rgba(148,163,184,.7);
          margin-bottom:3px;
        }
        .portal-dark-security-sub{
          font:400 10px/1.5 var(--sans);
          color:rgba(148,163,184,.4);
        }

        @media(max-width:400px){
          .portal-dark-grid{gap:10px}
          .portal-dark-card{padding:18px 10px 16px;gap:8px;border-radius:14px}
          .portal-dark-icon{width:58px;height:58px}
          .portal-dark-icon svg{width:28px!important;height:28px!important}
          .portal-dark-card-label{font-size:11px}
          .portal-dark-card-btn{font-size:10px;padding:6px 10px}
          .portal-dark-title-greeting{font-size:15px}
          .portal-dark-title-name{font-size:clamp(18px,7vw,26px)}
        }
      `}</style>
    </div>
  )
}
