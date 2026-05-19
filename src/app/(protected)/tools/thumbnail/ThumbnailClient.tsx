'use client'

import { useState, useRef, useEffect } from 'react'

type Feedback = {
  overall: string
  points: { label: string; comment: string; type: 'good' | 'improve' }[]
}

export default function ThumbnailClient() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください')
      return
    }
    setError('')
    setFeedback(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function analyze() {
    if (!imageFile || !image) return
    setLoading(true)
    setError('')
    setFeedback(null)
    try {
      const res = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image.split(',')[1], mimeType: imageFile.type }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFeedback(data.feedback)
    } catch {
      setError('解析に失敗しました。しばらくしてから再度お試しください。')
    }
    setLoading(false)
  }

  function reset() {
    setImage(null)
    setImageFile(null)
    setFeedback(null)
    setError('')
  }

  return (
    <>
      {/* アップロードエリア */}
      {!image ? (
        <div
          className="reveal"
          style={{
            border: `2px dashed ${dragging ? 'var(--pk)' : 'var(--bd)'}`,
            borderRadius: '20px',
            padding: '60px 24px',
            textAlign: 'center',
            background: dragging ? 'var(--pk-s)' : 'var(--wh)',
            cursor: 'pointer',
            transition: 'all .25s',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
          <div style={{ font: '700 16px var(--sans)', color: 'var(--dk)', marginBottom: '8px' }}>
            サムネイルをドラッグ＆ドロップ
          </div>
          <div style={{ font: '400 13px var(--sans)', color: 'var(--gy)', marginBottom: '20px' }}>
            または下のボタンからファイルを選択
          </div>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '12px',
              background: 'var(--pk-l)', color: 'var(--pk)',
              font: '700 13px var(--sans)', border: '1px solid rgba(37,99,235,.2)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            ファイルを選択
          </button>
          <div style={{ font: '400 11px var(--sans)', color: 'var(--gy)', marginTop: '16px' }}>
            JPG・PNG・WebP対応 / 最大10MB
          </div>
        </div>
      ) : (
        /* プレビュー＋解析 */
        <div className="reveal">
          <div style={{
            background: 'var(--wh)', borderRadius: '20px',
            padding: '24px', boxShadow: 'var(--shadow)',
            border: '1px solid var(--bd)', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img
                src={image}
                alt="サムネイルプレビュー"
                style={{ width: '240px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--shadow)' }}
              />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ font: '700 15px var(--sans)', color: 'var(--dk)', marginBottom: '6px' }}>
                  {imageFile?.name}
                </div>
                <div style={{ font: '400 12px var(--sans)', color: 'var(--gy)', marginBottom: '20px' }}>
                  {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={analyze}
                    disabled={loading}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '12px 24px', borderRadius: '12px',
                      background: loading ? 'var(--gy-l)' : 'linear-gradient(135deg,var(--pk),var(--co))',
                      color: loading ? 'var(--gy)' : '#fff',
                      font: '700 13px var(--sans)', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : 'var(--shadow-blue)',
                      transition: 'all .2s',
                    }}
                  >
                    {loading ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/>
                        </svg>
                        解析中...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        AIで添削する
                      </>
                    )}
                  </button>
                  <button
                    onClick={reset}
                    style={{
                      padding: '12px 20px', borderRadius: '12px',
                      background: 'var(--gy-l)', color: 'var(--dk2)',
                      font: '600 13px var(--sans)', cursor: 'pointer',
                    }}
                  >
                    別の画像を選ぶ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid rgba(239,68,68,.2)',
          borderRadius: '12px', padding: '12px 16px',
          font: '500 13px var(--sans)', color: '#DC2626', marginTop: '12px',
        }}>
          {error}
        </div>
      )}

      {/* フィードバック結果 */}
      {feedback && (
        <div className="reveal visible" style={{ marginTop: '24px' }}>
          {/* 総評 */}
          <div style={{
            background: 'linear-gradient(145deg,#0F172A,#1E293B)',
            borderRadius: '20px', padding: '24px', marginBottom: '16px',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg,var(--pk),var(--co))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <span style={{ font: '700 14px var(--sans)' }}>AIからの総評</span>
            </div>
            <p style={{ font: '400 14px/1.8 var(--sans)', color: 'rgba(255,255,255,.85)' }}>
              {feedback.overall}
            </p>
          </div>

          {/* 詳細ポイント */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedback.points.map((p, i) => (
              <div key={i} style={{
                background: 'var(--wh)', borderRadius: '16px', padding: '16px 20px',
                border: `1px solid ${p.type === 'good' ? 'rgba(16,185,129,.2)' : 'rgba(37,99,235,.15)'}`,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: p.type === 'good' ? 'rgba(16,185,129,.12)' : 'rgba(37,99,235,.10)',
                    fontSize: '12px',
                  }}>
                    {p.type === 'good' ? '✓' : '↑'}
                  </span>
                  <span style={{
                    font: '700 12px var(--sans)',
                    color: p.type === 'good' ? '#059669' : 'var(--pk)',
                  }}>
                    {p.label}
                  </span>
                </div>
                <p style={{ font: '400 13px/1.7 var(--sans)', color: 'var(--dk2)' }}>
                  {p.comment}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '12px 28px', borderRadius: '12px',
                background: 'var(--gy-l)', color: 'var(--dk2)',
                font: '600 13px var(--sans)', cursor: 'pointer',
              }}
            >
              別のサムネイルを添削する
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
