'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startAuthentication, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'
import '@/app/chance.css'

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/28EdR8fqicd1fMJdAPdfG02'
const TEST_EMAIL = 'chaoben3103@gmail.com'

/* 指紋アイコン */
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

/* Face ID アイコン */
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
  const [showEmailFirst, setShowEmailFirst] = useState(false)

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const isSubscriptionError = searchParams?.get('error') === 'subscription'

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(mobile)
    // 生体認証が使えるかチェック
    platformAuthenticatorIsAvailable()
      .then(available => setBiometricAvailable(available))
      .catch(() => setBiometricAvailable(false))
  }, [])

  const biometricLabel = isMobile ? 'Face IDでログイン' : '指紋認証でログイン'
  const BiometricIcon = isMobile ? FaceIdIcon : FingerprintIcon

  async function handleBiometricLogin() {
    setBiometricLoading(true)
    setBiometricError('')

    try {
      const optRes = await fetch('/api/webauthn/login-options', { method: 'POST' })
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

      const { token, email: userEmail } = await verRes.json()

      // マジックリンクトークンでセッションを作成
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink',
      })

      if (otpError) throw new Error('セッションの作成に失敗しました')

      router.push('/portal')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '認証に失敗しました'
      if (msg.includes('cancelled') || msg.includes('cancel') || msg.includes('abort') || msg.includes('not allowed')) {
        setBiometricError('')
        // キャンセルは静かに無視
      } else if (msg.includes('登録されていません') || msg.includes('not found') || msg.includes('Credential not found')) {
        setBiometricError('このデバイスにはFace ID / 指紋認証が登録されていません。\nパスワードでログインしてください。')
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
      if (error.message.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません。')
      } else {
        setError('ログインに失敗しました。しばらく経ってから再度お試しください。')
      }
      setLoading(false)
      return
    }

    router.push('/portal')
  }

  return (
    <div className="login-wrap">
      {/* 左：ログインフォーム */}
      <div className="login-left">
        <div className="lf">
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gy)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              After Support
            </div>
            <h1 className="lf-h">受講生専用サイトへ<br />ログイン</h1>
            <p className="lf-sub">ご入会時のメールアドレスとパスワードでログインしてください</p>
          </div>

          {isSubscriptionError && (
            <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', padding: '12px 16px', font: '500 13px var(--sans)', color: '#DC2626', marginBottom: '20px' }}>
              サブスクリプションが有効ではありません。ご確認ください。
            </div>
          )}

          {/* ── 生体認証ボタン（スマホのみ表示） ── */}
          {biometricAvailable && isMobile && (
            <div style={{ marginBottom: '20px' }}>
              {biometricError && (
                <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', padding: '10px 14px', font: '500 12px/1.6 var(--sans)', color: '#DC2626', marginBottom: '12px', whiteSpace: 'pre-line' }}>
                  {biometricError}
                </div>
              )}

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  background: biometricLoading
                    ? 'rgba(99,102,241,.07)'
                    : 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.12) 100%)',
                  border: '1.5px solid rgba(99,102,241,.3)',
                  color: '#6366F1',
                  font: '700 14px var(--sans)',
                  cursor: biometricLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all .2s',
                  letterSpacing: '.01em',
                }}
              >
                {biometricLoading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin .9s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".2"/><path d="M21 12a9 9 0 00-9-9"/>
                    </svg>
                    認証中...
                  </>
                ) : (
                  <>
                    <BiometricIcon size={20} color="#6366F1" />
                    {biometricLabel}
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(148,163,184,.2)' }}/>
                <span style={{ font: '500 11px var(--sans)', color: 'rgba(148,163,184,.7)', whiteSpace: 'nowrap' }}>またはパスワードでログイン</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(148,163,184,.2)' }}/>
              </div>
            </div>
          )}

          {/* ── メール・パスワードフォーム ── */}
          <form onSubmit={handleSubmit}>
            <div className="fg">
              <label>メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="fg">
              <label>パスワード</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', padding: '10px 14px', font: '500 13px var(--sans)', color: '#DC2626', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-login"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            <p className="lf-ft">
              <Link href="/reset-password" style={{ color: 'var(--pk)', textDecoration: 'none', fontWeight: '600' }}>
                パスワードをお忘れですか？
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* 右：ビジュアルパネル */}
      <div className="login-right">
        <div className="lp">
          <div className="lp-badge">受講生専用</div>
          <h2 className="lp-h">
            スキルアップを、<br />
            <em>もっと確実に。</em>
          </h2>
          <p className="lp-b">
            このサイトはご入会いただいた受講生専用のアフターサポートプラットフォームです。学習の疑問をAIに質問したり、制作物のフィードバックを受けることができます。
          </p>
          <ul className="lp-ul">
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              カリキュラムに基づいたAIチャットサポート
            </li>
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              サムネイルのAI画像添削
            </li>
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              講師へのZoom相談予約
            </li>
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              動画教材の視聴・学習管理
            </li>
          </ul>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <p style={{ font: '500 12px var(--sans)', color: 'rgba(255,255,255,.55)', marginBottom: '12px' }}>
              まだ入会していない方はこちら
            </p>
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', padding: '13px', borderRadius: '12px',
                background: 'rgba(255,255,255,.15)', color: '#fff',
                font: '700 13px var(--sans)', border: '1px solid rgba(255,255,255,.25)',
                cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
                transition: 'all .2s', boxSizing: 'border-box',
              }}
            >
              新規入会はこちら（Stripeで決済）
            </a>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
