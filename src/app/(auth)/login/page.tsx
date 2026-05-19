'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import '@/app/chance.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    setJoinLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setError('決済ページへの移動に失敗しました。しばらくしてから再度お試しください。')
    }
    setJoinLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('送信に失敗しました。メールアドレスをご確認ください。')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      {/* 左：ログインフォーム */}
      <div className="login-left">
        <div className="lf">
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gy)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              After Support
            </div>
            <h1 className="lf-h">受講生専用サイトへ<br />ログイン</h1>
            <p className="lf-sub">ご入会時のメールアドレスでログインしてください</p>
          </div>

          {sent ? (
            <div style={{
              background: 'var(--pk-s)',
              border: '1px solid rgba(37,99,235,.15)',
              borderRadius: '16px',
              padding: '28px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <p style={{ font: '700 15px var(--sans)', color: 'var(--dk)', marginBottom: '8px' }}>
                メールを送信しました
              </p>
              <p style={{ font: '400 13px/1.7 var(--sans)', color: 'var(--gy)' }}>
                <strong style={{ color: 'var(--dk)' }}>{email}</strong> に<br />
                ログインリンクを送信しました。<br />
                メールを確認してリンクをクリックしてください。
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{ marginTop: '20px', font: '600 12px var(--sans)', color: 'var(--pk)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                別のアドレスで試す
              </button>
            </div>
          ) : (
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

              {error && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid rgba(239,68,68,.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  font: '500 13px var(--sans)',
                  color: '#DC2626',
                  marginBottom: '16px',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-login"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? '送信中...' : 'ログインリンクを送る'}
              </button>

              <p className="lf-ft">
                パスワードは不要です。メールアドレスを入力すると<br />
                ログイン用リンクが届きます。
              </p>
            </form>
          )}
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
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              カリキュラムに基づいたAIチャットサポート
            </li>
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              サムネイルのAI画像添削
            </li>
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              講師へのZoom相談予約
            </li>
            <li>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              動画教材の視聴・学習管理
            </li>
          </ul>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <p style={{ font: '500 12px var(--sans)', color: 'rgba(255,255,255,.55)', marginBottom: '12px' }}>
              まだ入会していない方はこちら
            </p>
            <button
              onClick={handleJoin}
              disabled={joinLoading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: joinLoading ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.15)',
                color: '#fff',
                font: '700 13px var(--sans)',
                border: '1px solid rgba(255,255,255,.25)',
                cursor: joinLoading ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
              }}
            >
              {joinLoading ? '移動中...' : '新規入会（Stripeで決済）'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
