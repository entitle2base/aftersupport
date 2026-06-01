'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startAuthentication, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'
import '@/app/chance.css'

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/28EdR8fqicd1fMJdAPdfG02'

function FaceIdIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

function FingerprintIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [biometricError, setBiometricError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isSubscriptionError = searchParams?.get('error') === 'subscription'

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(mobile)
    platformAuthenticatorIsAvailable()
      .then(available => setBiometricAvailable(available))
      .catch(() => setBiometricAvailable(false))
  }, [])

  const BiometricIcon = isMobile ? FaceIdIcon : FingerprintIcon
  const biometricLabel = isMobile ? 'Face IDでログイン' : '指紋認証でログイン'

  async function handleBiometricLogin() {
    setBiometricLoading(true)
    setBiometricError('')
    try {
      const credentialId = localStorage.getItem('webauthn_credential_id') ?? undefined
      const optRes = await fetch('/api/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      })
      if (!optRes.ok) throw new Error('認証オプションの取得に失敗しました')
      const { options, challengeId } = await optRes.json()
      const credential = await startAuthentication({ optionsJSON: options })
      const verRes = await fetch('/api/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, challengeId }),
      })
      if (!verRes.ok) {
        const d = await verRes.json()
        throw new Error(d.error ?? '認証に失敗しました')
      }
      const { token } = await verRes.json()
      localStorage.setItem('webauthn_credential_id', credential.id)
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: token, type: 'magiclink' })
      if (otpError) throw new Error('セッションの作成に失敗しました')
      router.push('/portal')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '認証に失敗しました'
      if (msg.includes('cancelled') || msg.includes('cancel') || msg.includes('abort') || msg.includes('not allowed')) {
        setBiometricError('')
      } else if (msg.includes('登録されていません') || msg.includes('not found') || msg.includes('Credential not found')) {
        setBiometricError('このデバイスにはFace ID / 指紋認証が登録されていません。')
      } else {
        setBiometricError(msg)
      }
      setBiometricLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません。')
      setLoading(false)
      return
    }
    router.push('/portal')
  }

  return (
    <div className="lp-dark-wrap">
      {/* 背景エフェクト */}
      <div className="lp-dark-orb lp-dark-orb1"/>
      <div className="lp-dark-orb lp-dark-orb2"/>
      <div className="lp-dark-orb lp-dark-orb3"/>

      <div className="lp-dark-inner">
        {/* ロゴバッジ */}
        <div className="lp-dark-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 20 2 20"/>
          </svg>
          AFTER SUPPORT
        </div>

        {/* タイトル */}
        <h1 className="lp-dark-title">受講生専用サイトへ<br />ログイン</h1>
        <p className="lp-dark-sub">ご入会時のメールアドレスとパスワードでログインしてください</p>

        {/* サブスクエラー */}
        {isSubscriptionError && (
          <div className="lp-dark-error">
            サブスクリプションが有効ではありません。ご確認ください。
          </div>
        )}

        {/* ログインカード */}
        <div className="lp-dark-card">

          {/* Face IDボタン（スマホのみ） */}
          {biometricAvailable && isMobile && (
            <div style={{ marginBottom: '20px' }}>
              {biometricError && (
                <div className="lp-dark-error" style={{ marginBottom: '12px', fontSize: '12px' }}>{biometricError}</div>
              )}
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="lp-dark-biometric-btn"
              >
                {biometricLoading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'lpSpin .9s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".2"/><path d="M21 12a9 9 0 00-9-9"/>
                    </svg>
                    認証中...
                  </>
                ) : (
                  <>
                    <BiometricIcon size={20} color="currentColor" />
                    {biometricLabel}
                  </>
                )}
              </button>
              <div className="lp-dark-divider">
                <span className="lp-dark-divider-line"/>
                <span className="lp-dark-divider-text">またはパスワードでログイン</span>
                <span className="lp-dark-divider-line"/>
              </div>
            </div>
          )}

          {/* メール・パスワードフォーム */}
          <form onSubmit={handleSubmit}>
            <div className="lp-dark-fg">
              <label>メールアドレス</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"/>
            </div>
            <div className="lp-dark-fg">
              <label>パスワード</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
            </div>

            {error && <div className="lp-dark-error">{error}</div>}

            <button type="submit" disabled={loading} className="lp-dark-submit-btn">
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/reset-password" className="lp-dark-forgot">
                パスワードをお忘れですか？
              </Link>
            </div>
          </form>
        </div>

        {/* セキュリティ注記 */}
        <div className="lp-dark-security">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          AFTER SUPPORTは受講生限定のサポートです
        </div>
      </div>

      <style>{`
        .lp-dark-wrap{
          min-height:100vh;
          display:flex;align-items:center;justify-content:center;
          background:#060B1A;
          position:relative;overflow:hidden;
          padding:24px 16px;
        }
        .lp-dark-orb{position:absolute;border-radius:50%;pointer-events:none;animation:lpOrb 20s ease-in-out infinite}
        .lp-dark-orb1{width:600px;height:600px;background:radial-gradient(circle,rgba(47,107,255,.12) 0%,transparent 65%);top:-200px;right:-150px}
        .lp-dark-orb2{width:400px;height:400px;background:radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 65%);bottom:-100px;left:-100px;animation-duration:25s;animation-direction:reverse}
        .lp-dark-orb3{width:300px;height:300px;background:radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 65%);top:40%;left:40%;animation-duration:18s}
        @keyframes lpOrb{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-20px)}}
        @keyframes lpSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .lp-dark-inner{
          position:relative;z-index:1;
          width:100%;max-width:420px;
          display:flex;flex-direction:column;align-items:center;
          text-align:center;
        }
        .lp-dark-badge{
          display:inline-flex;align-items:center;gap:7px;
          background:rgba(47,107,255,.12);
          border:1px solid rgba(47,107,255,.3);
          border-radius:50px;padding:7px 18px;
          font:700 12px var(--sans);color:#60A5FA;
          letter-spacing:.08em;margin-bottom:24px;
        }
        .lp-dark-title{
          font:800 28px/1.2 var(--sans);
          color:#FFFFFF;margin-bottom:10px;
          letter-spacing:-.01em;
        }
        .lp-dark-sub{
          font:400 13px/1.6 var(--sans);
          color:rgba(148,163,184,.8);
          margin-bottom:28px;
        }
        .lp-dark-card{
          width:100%;
          background:rgba(255,255,255,.04);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(255,255,255,.1);
          border-radius:20px;padding:28px;
          box-shadow:0 8px 40px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.06);
          margin-bottom:20px;
          text-align:left;
        }
        .lp-dark-biometric-btn{
          width:100%;padding:14px;
          border-radius:12px;
          background:rgba(47,107,255,.12);
          border:1.5px solid rgba(47,107,255,.4);
          color:#60A5FA;
          font:700 14px var(--sans);
          cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:10px;
          transition:all .2s;
        }
        .lp-dark-biometric-btn:hover:not(:disabled){
          background:rgba(47,107,255,.2);
          border-color:rgba(47,107,255,.6);
        }
        .lp-dark-biometric-btn:disabled{opacity:.6;cursor:not-allowed}
        .lp-dark-divider{
          display:flex;align-items:center;gap:10px;
          margin:18px 0 0;
        }
        .lp-dark-divider-line{flex:1;height:1px;background:rgba(148,163,184,.12)}
        .lp-dark-divider-text{font:500 11px var(--sans);color:rgba(148,163,184,.5);white-space:nowrap}
        .lp-dark-fg{margin-bottom:14px}
        .lp-dark-fg label{
          display:block;font:600 12px var(--sans);
          color:rgba(148,163,184,.9);margin-bottom:6px;
          letter-spacing:.03em;
        }
        .lp-dark-fg input{
          width:100%;padding:12px 14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);
          border-radius:10px;
          color:#FFFFFF;font:400 14px var(--sans);
          transition:border-color .2s,box-shadow .2s;
          outline:none;
        }
        .lp-dark-fg input::placeholder{color:rgba(148,163,184,.35)}
        .lp-dark-fg input:focus{
          border-color:rgba(47,107,255,.5);
          box-shadow:0 0 0 3px rgba(47,107,255,.12);
        }
        .lp-dark-error{
          background:rgba(239,68,68,.1);
          border:1px solid rgba(239,68,68,.25);
          border-radius:10px;padding:10px 14px;
          font:500 12px var(--sans);color:#FCA5A5;
          margin-bottom:14px;
        }
        .lp-dark-submit-btn{
          width:100%;padding:14px;
          border-radius:12px;
          background:linear-gradient(135deg,#1D4ED8,#2F6BFF);
          color:#fff;font:700 15px var(--sans);
          cursor:pointer;border:none;
          box-shadow:0 4px 20px rgba(47,107,255,.4);
          transition:all .2s;margin-top:4px;
        }
        .lp-dark-submit-btn:hover:not(:disabled){
          transform:translateY(-1px);
          box-shadow:0 6px 24px rgba(47,107,255,.55);
        }
        .lp-dark-submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .lp-dark-forgot{
          font:500 12px var(--sans);
          color:rgba(96,165,250,.8);
          text-decoration:none;
          transition:color .2s;
        }
        .lp-dark-forgot:hover{color:#60A5FA}
        .lp-dark-security{
          display:flex;align-items:center;gap:7px;
          font:500 11px var(--sans);
          color:rgba(148,163,184,.45);
        }

        @media(max-width:480px){
          .lp-dark-title{font-size:24px}
          .lp-dark-card{padding:20px}
        }
      `}</style>
    </div>
  )
}
