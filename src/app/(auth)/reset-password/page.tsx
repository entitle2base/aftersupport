'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import '@/app/chance.css'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
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
      <div className="login-left">
        <div className="lf">
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gy)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              After Support
            </div>
            <h1 className="lf-h">パスワードの<br />再設定</h1>
            <p className="lf-sub">登録済みのメールアドレスに再設定用リンクを送信します</p>
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
                パスワード再設定用リンクを送信しました。<br />
                メールを確認してリンクをクリックしてください。
              </p>
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
                {loading ? '送信中...' : '再設定メールを送る'}
              </button>

              <p className="lf-ft">
                <Link
                  href="/login"
                  style={{ color: 'var(--pk)', textDecoration: 'none', fontWeight: '600' }}
                >
                  ログインに戻る
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      <div className="login-right">
        <div className="lp">
          <div className="lp-badge">受講生専用</div>
          <h2 className="lp-h">
            スキルアップを、<br />
            <em>もっと確実に。</em>
          </h2>
          <p className="lp-b">
            パスワードをお忘れの場合は、登録済みのメールアドレスを入力してください。再設定用のリンクをお送りします。
          </p>
        </div>
      </div>
    </div>
  )
}
