'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { startRegistration, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'
import '@/app/chance.css'


function BiometricIcon({ isMobile, size = 56, color = '#6366F1' }: { isMobile: boolean; size?: number; color?: string }) {
  if (isMobile) {
    // Face ID
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <circle cx="9" cy="10" r="1" fill={color} stroke="none"/>
        <circle cx="15" cy="10" r="1" fill={color} stroke="none"/>
        <path d="M9 14s1 2 3 2 3-2 3-2"/>
      </svg>
    )
  }
  // 指紋
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 1C6.48 1 2 5.48 2 11c0 3.54 1.77 6.67 4.47 8.55"/>
      <path d="M22 11c0-5.52-4.48-10-10-10"/>
      <path d="M7 11a5 5 0 0 1 5-5"/>
      <path d="M17 11a5 5 0 0 0-5-5"/>
      <path d="M12 7a4 4 0 0 1 4 4c0 2-.5 5-1.5 7"/>
      <path d="M12 7a4 4 0 0 0-4 4c0 2 .5 5 1.5 7"/>
      <path d="M12 11v.5"/>
    </svg>
  )
}

export default function BiometricSetupPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    platformAuthenticatorIsAvailable()
      .then(setAvailable)
      .catch(() => setAvailable(false))
  }, [])

  // PCからのアクセスはブロック
  if (typeof window !== 'undefined' && available !== null && !isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '24px', gap: '12px' }}>
        <p style={{ font: '500 15px var(--sans)', color: 'var(--gy)' }}>この設定はスマートフォンから行ってください。</p>
        <button onClick={() => router.push('/portal')} style={{ background: 'none', border: 'none', color: 'var(--pk)', font: '600 13px var(--sans)', cursor: 'pointer' }}>ポータルへ戻る</button>
      </div>
    )
  }

  const biometricName = 'Face ID'

  async function handleSetup() {
    setLoading(true)
    setError('')
    try {
      // セッショントークンをヘッダーで送る
      const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('セッションが切れています。再ログインしてください。')

      const optRes = await fetch('/api/webauthn/register-options', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      if (!optRes.ok) {
        const d = await optRes.json()
        throw new Error(d.error ?? '設定に失敗しました')
      }
      const { options, challengeId } = await optRes.json()

      const credential = await startRegistration({ optionsJSON: options })

      const verRes = await fetch('/api/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ credential, challengeId }),
      })
      if (!verRes.ok) {
        const d = await verRes.json()
        throw new Error(d.error ?? '設定に失敗しました')
      }

      setDone(true)
      setTimeout(() => router.push('/portal'), 2200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '設定に失敗しました'
      if (msg.includes('cancel') || msg.includes('abort') || msg.includes('not allowed')) {
        setError('キャンセルされました。もう一度お試しください。')
      } else {
        setError(msg)
      }
      setLoading(false)
    }
  }

  /* 完了画面 */
  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', textAlign: 'center', padding: '24px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,163,90,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22A35A" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ font: '700 22px var(--sans)', color: 'var(--dk)', margin: 0 }}>登録完了！</h2>
        <p style={{ font: '400 14px/1.8 var(--sans)', color: 'var(--gy)', margin: 0 }}>
          次回から{biometricName}でログインできます。
        </p>
        <p style={{ font: '500 12px var(--sans)', color: 'rgba(148,163,184,.7)', margin: 0 }}>ポータルへ戻ります...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '420px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>

      {/* アイコン */}
      {available !== null && (
        <BiometricIcon isMobile={isMobile} size={60} color="#6366F1" />
      )}

      {/* タイトル */}
      <h1 style={{ font: '700 22px var(--sans)', color: 'var(--dk)', margin: '18px 0 10px' }}>
        {biometricName}でログインを設定
      </h1>
      <p style={{ font: '400 14px/1.7 var(--sans)', color: 'var(--gy)', margin: '0 0 28px' }}>
        次回からパスワード入力なしで、<br />タップするだけでログインできます。
      </p>


      {/* 非対応 */}
      {available === false && (
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '12px', padding: '16px', font: '500 13px var(--sans)', color: '#DC2626', marginBottom: '20px' }}>
          このデバイスは生体認証に対応していません。
        </div>
      )}

      {/* エラー */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', padding: '10px 14px', font: '500 12px var(--sans)', color: '#DC2626', marginBottom: '16px', textAlign: 'left' }}>
          {error}
        </div>
      )}

      {/* メインボタン */}
      {available && (
        <button
          onClick={handleSetup}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: loading ? 'rgba(99,102,241,.4)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            color: '#fff', font: '700 15px var(--sans)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all .2s', marginBottom: '12px',
          }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin .9s linear infinite' }}>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/>
              </svg>
              設定中...
            </>
          ) : (
            <>
              <BiometricIcon isMobile={isMobile} size={20} color="#fff" />
              {biometricName}を設定する
            </>
          )}
        </button>
      )}

      <button
        onClick={() => router.push('/portal')}
        style={{ background: 'transparent', border: 'none', font: '500 13px var(--sans)', color: 'rgba(148,163,184,.8)', cursor: 'pointer', padding: '8px' }}
      >
        スキップして後で設定する
      </button>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
