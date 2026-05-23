'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import '@/app/chance.css'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('パスワードが一致しません。')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください。')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('パスワードの設定に失敗しました。リンクの有効期限が切れている可能性があります。')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

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

          <form onSubmit={handleSubmit}>
            <div className="fg">
              <label>新しいパスワード</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
              />
            </div>

            <div className="fg">
              <label>パスワード（確認）</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="もう一度入力"
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
              {loading ? '設定中...' : 'パスワードを設定する'}
            </button>
          </form>
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
            パスワードを設定すると、次回からはメールとパスワードだけですぐにログインできるようになります。
          </p>
        </div>
      </div>
    </div>
  )
}
