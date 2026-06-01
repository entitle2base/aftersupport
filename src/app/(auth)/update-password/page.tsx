'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { startRegistration, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'
import '@/app/chance.css'

type Step = 'password' | 'biometric' | 'done'

/* デバイス種別に応じたラベル */
function getBiometricLabel() {
  if (typeof window === 'undefined') return { title: '生体認証', sub: '' }
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) {
    return {
      title: 'Face ID / Touch ID でログインを設定',
      sub: 'iCloudキーチェーンに保存されるので、同じApple IDのiPhone・Macどちらでも使えます。',
      btn: 'Face ID / Touch ID を設定する',
    }
  }
  if (/Android/.test(ua)) {
    return {
      title: '指紋認証 / 顔認証でログインを設定',
      sub: 'Googleパスワードマネージャーに保存されるので、同じGoogleアカウントのデバイスで使えます。',
      btn: '指紋認証を設定する',
    }
  }
  return {
    title: '指紋認証（Touch ID）でログインを設定',
    sub: 'Macをお使いの場合、Touch IDで素早くログインできます。iPhoneでも使いたい場合は、スマホからも設定できます。',
    btn: '指紋認証を設定する',
  }
}

/* 指紋アイコン SVG */
function FingerprintIcon({ size = 48, color = 'var(--pk)' }: { size?: number; color?: string }) {
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

/* Face ID アイコン SVG */
function FaceIdIcon({ size = 48, color = 'var(--pk)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <circle cx="9" cy="10" r="1" fill={color}/>
      <circle cx="15" cy="10" r="1" fill={color}/>
      <path d="M9 14s1 2 3 2 3-2 3-2"/>
    </svg>
  )
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [biometricError, setBiometricError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const labels = getBiometricLabel()

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('パスワードが一致しません。'); return }
    if (password.length < 8) { setError('パスワードは8文字以上で設定してください。'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('パスワードの設定に失敗しました。リンクの有効期限が切れている可能性があります。')
      setLoading(false)
      return
    }

    // スマホのみ生体認証ステップを表示
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (mobile) {
      const available = await platformAuthenticatorIsAvailable().catch(() => false)
      setBiometricAvailable(available)
      if (available) {
        setStep('biometric')
        setLoading(false)
        return
      }
    }
    router.push('/dashboard')
    setLoading(false)
  }

  async function handleBiometricSetup() {
    setBiometricLoading(true)
    setBiometricError('')

    try {
      const optRes = await fetch('/api/webauthn/register-options', { method: 'POST' })
      if (!optRes.ok) {
        const d = await optRes.json()
        throw new Error(d.error ?? '設定に失敗しました')
      }
      const { options, challengeId } = await optRes.json()

      const credential = await startRegistration({ optionsJSON: options })

      const verRes = await fetch('/api/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, challengeId }),
      })

      if (!verRes.ok) {
        const d = await verRes.json()
        throw new Error(d.error ?? '設定に失敗しました')
      }

      // 次回ログイン時にiOSが直接Face IDを起動できるようcredential IDを保存
      localStorage.setItem('webauthn_credential_id', credential.id)

      setStep('done')
      setTimeout(() => router.push('/dashboard'), 1800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '設定に失敗しました'
      if (msg.includes('cancelled') || msg.includes('cancel') || msg.includes('abort')) {
        setBiometricError('キャンセルされました。後からでも設定できます。')
      } else {
        setBiometricError(msg)
      }
      setBiometricLoading(false)
    }
  }

  /* ──────────────── STEP: パスワード設定 ──────────────── */
  if (step === 'password') {
    return (
      <div className="login-wrap">
        <div className="login-left">
          <div className="lf">
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gy)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                After Support
              </div>
              <h1 className="lf-h">パスワードを<br />設定する</h1>
              <p className="lf-sub">新しいパスワードを設定してください（8文字以上）</p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="fg">
                <label>新しいパスワード</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="8文字以上" />
              </div>
              <div className="fg">
                <label>パスワード（確認）</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="もう一度入力" />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', padding: '10px 14px', font: '500 13px var(--sans)', color: '#DC2626', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-login" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? '設定中...' : 'パスワードを設定する'}
              </button>
            </form>
          </div>
        </div>

        <div className="login-right">
          <div className="lp">
            <div className="lp-badge">受講生専用</div>
            <h2 className="lp-h">スキルアップを、<br /><em>もっと確実に。</em></h2>
            <p className="lp-b">パスワードを設定すると、次のステップでFace IDや指紋認証でログインする設定もできます。</p>
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────── STEP: 生体認証設定 ──────────────── */
  if (step === 'biometric') {
    return (
      <div className="login-wrap">
        <div className="login-left">
          <div className="lf">
            {/* パスワード設定完了バッジ */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(34,163,90,.1)', border: '1px solid rgba(34,163,90,.25)',
              borderRadius: '50px', padding: '6px 14px', marginBottom: '28px',
              font: '600 12px var(--sans)', color: '#22A35A',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22A35A" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              パスワードの設定が完了しました
            </div>

            <div style={{ marginBottom: '28px', textAlign: 'center' }}>
              {isMobile
                ? <FaceIdIcon size={56} />
                : <FingerprintIcon size={56} />
              }
              <h1 className="lf-h" style={{ marginTop: '16px' }}>{labels.title}</h1>
              <p className="lf-sub" style={{ marginTop: '8px' }}>
                次回から、パスワード入力なしで<br />素早くログインできます。
              </p>
            </div>

            {/* iCloud / Googleの自動同期説明 */}
            <div style={{
              background: 'rgba(99,102,241,.06)',
              border: '1px solid rgba(99,102,241,.18)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ font: '400 12px/1.7 var(--sans)', color: 'var(--gy)', margin: 0 }}>
                {labels.sub}
              </p>
            </div>

            {biometricError && (
              <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', padding: '10px 14px', font: '500 12px var(--sans)', color: '#DC2626', marginBottom: '16px' }}>
                {biometricError}
              </div>
            )}

            <button
              onClick={handleBiometricSetup}
              disabled={biometricLoading}
              className="btn-login"
              style={{ opacity: biometricLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {biometricLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  設定中...
                </>
              ) : (
                <>
                  {isMobile
                    ? <FaceIdIcon size={18} color="#fff" />
                    : <FingerprintIcon size={18} color="#fff" />
                  }
                  {labels.btn}
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              disabled={biometricLoading}
              style={{
                width: '100%', marginTop: '12px', padding: '13px',
                background: 'transparent', border: 'none',
                font: '500 13px var(--sans)', color: 'var(--gy)',
                cursor: 'pointer', borderRadius: '10px',
                transition: 'color .2s',
              }}
            >
              スキップしてダッシュボードへ →
            </button>
          </div>
        </div>

        <div className="login-right">
          <div className="lp">
            <div className="lp-badge">受講生専用</div>
            <h2 className="lp-h">スキルアップを、<br /><em>もっと確実に。</em></h2>
            <p className="lp-b">
              Face IDや指紋認証を設定しておくと、次回からパスワードを入力せずにすぐにログインできます。
            </p>
            <ul className="lp-ul">
              <li>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                iPhoneで登録→Macでも自動で使える
              </li>
              <li>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                パスワード入力が不要になる
              </li>
              <li>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                後から複数デバイスで追加登録も可能
              </li>
            </ul>
          </div>
        </div>

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  /* ──────────────── STEP: 登録完了 ──────────────── */
  return (
    <div className="login-wrap">
      <div className="login-left">
        <div className="lf" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {isMobile ? '🔐' : '☝️'}
          </div>
          <h1 className="lf-h">登録完了！</h1>
          <p className="lf-sub" style={{ marginTop: '8px' }}>
            {isMobile ? 'Face ID / Touch ID' : '指紋認証'}の設定が完了しました。<br />
            次回からパスワードなしでログインできます。
          </p>
          <div style={{ marginTop: '24px', font: '500 13px var(--sans)', color: 'var(--gy)' }}>
            ダッシュボードへ移動中...
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="lp">
          <div className="lp-badge">受講生専用</div>
          <h2 className="lp-h">スキルアップを、<br /><em>もっと確実に。</em></h2>
        </div>
      </div>
    </div>
  )
}
