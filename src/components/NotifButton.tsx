'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  notifDay1?: boolean
  notifDay5?: boolean
  notifDay8?: boolean
  invoiceStatus?: string | null  // 'pending' | 'submitted' | 'paid' | null
  billingMonth?: string
}

export default function NotifButton({ notifDay1, notifDay5, notifDay8, invoiceStatus, billingMonth }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // 通知レベルを判定
  const hasInvoiceNotif = (notifDay1 || notifDay5 || notifDay8) && invoiceStatus !== 'submitted' && invoiceStatus !== 'paid'
  const isUrgent = notifDay8 && invoiceStatus !== 'submitted' && invoiceStatus !== 'paid'
  const isWarning = notifDay5 && !notifDay8 && invoiceStatus !== 'submitted' && invoiceStatus !== 'paid'

  // バッジの色
  const badgeColor = isUrgent ? '#EF4444' : isWarning ? '#F59E0B' : 'var(--ds-blue-bright)'

  const monthLabel = billingMonth
    ? billingMonth.replace('-', '年') + '月分'
    : '今月分'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="ds-hdr-notif"
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
        style={{ position: 'relative' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        お知らせ
        {hasInvoiceNotif && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: badgeColor,
            border: '1.5px solid var(--ds-bg-deep)',
          }}/>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: 0,
          minWidth: '260px',
          background: 'var(--ds-bg-card)',
          border: '1px solid var(--ds-border)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          padding: '12px',
          zIndex: 300,
          animation: 'fadeIn .15s ease',
        }}>
          {hasInvoiceNotif ? (
            <div>
              <div style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: isUrgent
                  ? 'rgba(239,68,68,.1)'
                  : isWarning
                    ? 'rgba(245,158,11,.1)'
                    : 'rgba(0,148,255,.08)',
                border: `1px solid ${isUrgent ? 'rgba(239,68,68,.3)' : isWarning ? 'rgba(245,158,11,.3)' : 'rgba(0,148,255,.2)'}`,
                marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: isUrgent ? '#EF4444' : isWarning ? '#F59E0B' : 'var(--ds-blue-bright)',
                  marginBottom: 6,
                }}>
                  {isUrgent ? '⚠️ 請求書の締め切りが近づいています' : isWarning ? '📋 請求書のリマインダー' : '📢 請求書の送付をお願いします'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ds-text-body)', lineHeight: 1.6 }}>
                  {monthLabel}の請求書がまだ送付されていません。
                  {isUrgent && <><br/><strong style={{ color: '#EF4444' }}>10日までに送付してください。</strong></>}
                </div>
              </div>
              <Link
                href="/tools/invoice"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', width: '100%',
                  padding: '10px 14px', borderRadius: 8,
                  background: isUrgent
                    ? 'rgba(239,68,68,.15)'
                    : 'rgba(0,148,255,.12)',
                  border: `1px solid ${isUrgent ? 'rgba(239,68,68,.3)' : 'rgba(0,148,255,.2)'}`,
                  color: isUrgent ? '#EF4444' : 'var(--ds-blue-bright)',
                  fontSize: 13, fontWeight: 700,
                  textAlign: 'center', cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                請求書を送付する →
              </Link>
            </div>
          ) : invoiceStatus === 'submitted' || invoiceStatus === 'paid' ? (
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(34,163,90,.08)', border: '1px solid rgba(34,163,90,.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22A35A', marginBottom: 4 }}>✓ 請求書送付済み</div>
              <div style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
                {monthLabel}の請求書は送付されています。
                {invoiceStatus === 'paid' && '（支払済み）'}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--ds-text-muted)', textAlign: 'center', lineHeight: 1.6, padding: '4px 0' }}>
              現在お知らせはありません
            </p>
          )}
        </div>
      )}
    </div>
  )
}
