'use client'

import { useState } from 'react'

interface Job {
  work_type: string
  quantity: number
  unit_price: number
  total_amount: number
  note: string | null
}

interface InvoiceData {
  id: string
  status: string
  total_amount: number
  submitted_at: string | null
}

interface Props {
  senderName: string
  senderEmail: string
  billingMonth: string
  jobs: Job[]
  invoice: InvoiceData | null
}

export default function InvoiceClient({ senderName, senderEmail, billingMonth, jobs, invoice }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(invoice?.status === 'submitted' || invoice?.status === 'paid')
  const [error, setError] = useState('')

  const monthLabel = billingMonth.replace('-', '年') + '月分'
  const totalAmount = invoice?.total_amount ?? jobs.reduce((sum, j) => sum + j.total_amount, 0)
  const hasJobs = jobs.length > 0

  async function handleSubmit() {
    if (!invoice?.id) { setError('請求書データが見つかりません'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/invoice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '送信に失敗しました')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  /* ── 送信済み ── */
  if (submitted) {
    return (
      <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center', paddingTop: 64 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#22A35A,#16c47a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(34,163,90,.35)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>請求書を送付しました</h2>
        <p style={{ color: 'var(--ds-text-body)', fontSize: 14, lineHeight: 1.8, marginBottom: 32 }}>
          {monthLabel}の請求書の送付が完了しました。<br />
          支払い処理が完了するまでしばらくお待ちください。
        </p>
        <div style={{
          background: 'var(--ds-bg-card)', border: '1px solid var(--ds-border)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 12, color: 'var(--ds-text-muted)', marginBottom: 4 }}>請求金額</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>¥{totalAmount.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--ds-text-muted)', marginTop: 4 }}>{monthLabel}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
          送付日時：{invoice?.submitted_at
            ? new Date(invoice.submitted_at).toLocaleString('ja-JP')
            : new Date().toLocaleString('ja-JP')}
        </div>
      </div>
    )
  }

  /* ── 案件未入力 ── */
  if (!hasJobs) {
    return (
      <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center', paddingTop: 64 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          {monthLabel}の案件がまだ入力されていません
        </h2>
        <p style={{ color: 'var(--ds-text-body)', fontSize: 14, lineHeight: 1.8 }}>
          講師が案件を入力すると、ここに請求書の内容が表示されます。<br />
          しばらくお待ちください。
        </p>
      </div>
    )
  }

  /* ── 送付フォーム ── */
  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>請求書の送付</h1>
        <p style={{ color: 'var(--ds-text-sub)', fontSize: 13 }}>
          {monthLabel}の請求内容を確認して「送付する」ボタンを押してください。
        </p>
      </div>

      {/* 請求内容カード */}
      <div style={{
        background: 'var(--ds-bg-card)', border: '1px solid var(--ds-border)',
        borderRadius: 16, padding: '20px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>
          請求内容
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['品目', '数量', '単価（税込）', '小計'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 10px', fontSize: 12,
                    color: 'var(--ds-text-muted)', borderBottom: '1px solid var(--ds-border)', fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 600, fontSize: 14 }}>
                    {job.work_type}
                    {job.note && <div style={{ fontSize: 11, color: 'var(--ds-text-muted)', fontWeight: 400, marginTop: 2 }}>{job.note}</div>}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--ds-text-body)', fontSize: 14 }}>{job.quantity}本</td>
                  <td style={{ padding: '12px 10px', color: 'var(--ds-text-body)', fontSize: 14 }}>¥{job.unit_price.toLocaleString()}</td>
                  <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 700, fontSize: 14 }}>¥{job.total_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 合計 */}
        <div style={{
          borderTop: '1px solid var(--ds-border)', marginTop: 8, paddingTop: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: 'var(--ds-text-muted)', fontSize: 13 }}>合計（税込）</span>
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>¥{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* 請求元情報 */}
      <div style={{
        background: 'var(--ds-bg-card)', border: '1px solid var(--ds-border)',
        borderRadius: 16, padding: '16px 20px', marginBottom: 16,
        display: 'flex', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ds-text-muted)', fontWeight: 600, marginBottom: 4 }}>請求元</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{senderName || '（氏名未設定）'}</div>
          <div style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>{senderEmail}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ds-text-muted)', fontWeight: 600, marginBottom: 4 }}>請求先</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>エンタイトルツーベース株式会社</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ds-text-muted)', fontWeight: 600, marginBottom: 4 }}>対象月</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{monthLabel}</div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
          color: '#EF4444', fontSize: 13,
        }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: '100%', padding: '18px', borderRadius: 14,
          cursor: submitting ? 'not-allowed' : 'pointer',
          background: submitting ? 'rgba(22,119,255,.4)' : 'linear-gradient(135deg,var(--ds-blue),var(--ds-blue-bright))',
          border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
          boxShadow: submitting ? 'none' : '0 6px 24px rgba(22,119,255,.45)',
          transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {submitting ? (
          '送付中...'
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            請求書を送付する
          </>
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ds-text-muted)', marginTop: 14, lineHeight: 1.7 }}>
        送付すると内容の変更はできません。<br />
        内容に誤りがある場合は講師にお知らせください。
      </p>
    </div>
  )
}
