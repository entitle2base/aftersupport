'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/app/chance.css'

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/28EdR8fqicd1fMJdAPdfG02'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const isSubscriptionError = searchParams?.get('error') === 'subscription'

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
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gy)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              After Support
            </div>
            <h1 className="lf-h">受講生専用サイトへ<br />ログイン</h1>
            <p className="lf-sub">ご入会時のメールアドレスとパスワードでログインしてください</p>
          </div>

          {isSubscriptionError && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid rgba(239,68,68,.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              font: '500 13px var(--sans)',
              color: '#DC2626',
              marginBottom: '20px',
            }}>
              サブスクリプションが有効ではありません。ご確認ください。
            </div>
          )}

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
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            <p className="lf-ft">
              <Link
                href="/reset-password"
                style={{ color: 'var(--pk)', textDecoration: 'none', fontWeight: '600' }}
              >
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
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,.15)',
                color: '#fff',
                font: '700 13px var(--sans)',
                border: '1px solid rgba(255,255,255,.25)',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all .2s',
                boxSizing: 'border-box',
              }}
            >
              新規入会はこちら（Stripeで決済）
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
