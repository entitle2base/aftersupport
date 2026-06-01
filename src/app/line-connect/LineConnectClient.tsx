'use client'

export default function LineConnectClient({
  lineAuthUrl,
  error,
  msg,
}: {
  lineAuthUrl: string
  error?: string
  msg?: string
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '20px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>

        {/* LINEアイコン */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#06C755',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(6,199,85,.3)',
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C11.163 4 4 10.268 4 18c0 5.21 3.128 9.776 7.845 12.397L10 36l6.058-2.693A17.7 17.7 0 0020 33.6c8.837 0 16-6.268 16-14.6S28.837 4 20 4z" fill="white"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          LINEと連携してください
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8, marginBottom: 28 }}>
          サービスをご利用いただくために、<br />
          LINEアカウントとの連携が必要です。<br />
          一度だけの操作で完了します。
        </p>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
            color: '#EF4444', fontSize: 13, textAlign: 'left',
          }}>
            <div>{error === 'denied' ? 'LINEの連携をキャンセルしました。もう一度お試しください。' : `エラー: ${error}`}</div>
            {msg && <div style={{ fontSize: 11, marginTop: 6, wordBreak: 'break-all', opacity: 0.8 }}>{msg}</div>}
          </div>
        )}

        <a
          href={lineAuthUrl}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '14px 20px',
            background: '#06C755', color: '#fff',
            borderRadius: 12, fontWeight: 700, fontSize: 16,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(6,199,85,.35)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C11.163 4 4 10.268 4 18c0 5.21 3.128 9.776 7.845 12.397L10 36l6.058-2.693A17.7 17.7 0 0020 33.6c8.837 0 16-6.268 16-14.6S28.837 4 20 4z" fill="white"/>
          </svg>
          LINEと連携する
        </a>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
          LINEのプロフィール名・アイコンのみ取得します。<br />
          メッセージの内容は取得しません。
        </p>
      </div>
    </div>
  )
}
