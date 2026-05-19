'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'bot' | 'user'; text: string }

const INITIAL_MESSAGE: Message = {
  role: 'bot',
  text: 'こんにちは！動画編集の疑問はお気軽にどうぞ。',
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: data.error ?? 'エラーが発生しました。もう一度お試しください。' }])
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'エラーが発生しました。もう一度お試しください。' }])
    }
    setLoading(false)
  }

  return (
    <div className="chat-widget">
      {/* チャットパネル */}
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-head">
            <div className="chat-panel-head-left">
              <div className="chat-panel-ico">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div>
                <div className="chat-panel-title">AIサポート</div>
                <div className="chat-panel-sub">動画編集の疑問に回答します</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
            ))}
            {loading && (
              <div className="chat-msg bot" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 13px' }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span key={i} style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'rgba(255,255,255,.4)',
                    display: 'inline-block',
                    animation: `floatY 1.2s ease ${delay}s infinite`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="chat-input-row">
            <input
              className="chat-inp"
              placeholder="質問を入力…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <button className="chat-send" onClick={send} disabled={loading}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* トグルボタン（PC：ピル型ラベル付き / スマホ：横長バー） */}
      <button className="chat-toggle" onClick={() => setOpen(prev => !prev)}>
        {open ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>閉じる</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>AIに質問する</span>
          </>
        )}
      </button>
    </div>
  )
}
