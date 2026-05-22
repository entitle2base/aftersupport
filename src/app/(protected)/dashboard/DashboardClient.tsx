'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

/* ── 型 ── */
type Feedback = {
  totalScore: number
  designScore: number
  textScore: number
  designFeedback: string
  textFeedback: string
  overall: string
  points: { label: string; comment: string; type: 'good' | 'improve' }[]
}

type VideoItem = {
  id: number
  title: string
  videoKey?: string
  tags: string[]
  status: 'done' | 'unwatched' | 'recommend'
  bg?: string
  emoji?: string
  desc?: string
  dur?: string
}

/* ── データ ── */
const PAGE_TABS = ['動画編集', 'SNS運用', 'AI活用']
const CATEGORY_CHIPS = ['すべて', 'カット編集', 'テロップ', 'BGM・SE', 'エフェクト', 'アニメーション', '書き出し']

const VIDEOS: VideoItem[] = [
  { id:1, title:'テロップをカッコよく見せる3要素', videoKey:'telop-3-elements.mp4', tags:['テロップ'], status:'done', bg:'linear-gradient(160deg,#12193a,#1e2d60)', emoji:'Aa', desc:'視聴者の目を引くテロップデザインの3つのポイントを解説', dur:'実演' },
  { id:2, title:'プレミアプロ画面配置', videoKey:'premiere-screen-layout.mp4', tags:['動画編集'], status:'unwatched', bg:'linear-gradient(160deg,#101a10,#1a2e1a)', emoji:'🎬', desc:'Premiere Proの最適な作業環境・画面レイアウトを整える', dur:'実演' },
  { id:3, title:'カット編集の基本', tags:['カット'], status:'unwatched', bg:'linear-gradient(160deg,#0a1628,#162a50)', emoji:'✂️', desc:'不要な部分をカットし、テンポの良い映像を作る', dur:'準備中' },
  { id:4, title:'BGM・SEの選び方', tags:['BGM・SE'], status:'unwatched', bg:'linear-gradient(160deg,#0d1f1a,#142e25)', emoji:'🎵', desc:'シーンに合った音楽・効果音の選び方', dur:'準備中' },
  { id:5, title:'撮影の基本設定', tags:['動画編集'], status:'unwatched', bg:'linear-gradient(160deg,#1a1030,#2d1a50)', emoji:'📷', desc:'高品質な映像を撮るためのカメラ設定', dur:'準備中' },
  { id:6, title:'キーフレームアニメーション', tags:['アニメーション'], status:'recommend', bg:'linear-gradient(160deg,#0f1a35,#1c2e5e)', emoji:'🌀', desc:'動きのある表現を基本から学ぶ', dur:'準備中' },
  { id:7, title:'テロップアニメーション応用', tags:['テロップ','アニメーション'], status:'unwatched', bg:'linear-gradient(160deg,#1a1540,#2d256b)', emoji:'💫', desc:'印象的な動くテロップを作成する', dur:'準備中' },
]

const CATEGORIES = [
  { label:'カット編集', emoji:'✂️', desc:'不要な部分を削除しテンポよく魅せる', color:'#8B5CF6' },
  { label:'テロップ', emoji:'T', desc:'目を引くテロップで訴求力を高める', color:'#A855F7' },
  { label:'BGM・SE', emoji:'♪', desc:'音楽と効果音で感情をコントロール', color:'#7C3AED' },
  { label:'エフェクト', emoji:'✦', desc:'視覚効果で映像をプロレベルに', color:'#1677FF' },
  { label:'アニメーション', emoji:'▶', desc:'動きを加えて印象的に魅せる', color:'#A855F7' },
  { label:'書き出し', emoji:'↑', desc:'最適な設定で高画質に書き出す', color:'#1677FF' },
]

/* score helpers */
function scoreColor(n: number) {
  if (n >= 80) return '#22A35A'
  if (n >= 60) return '#D69A12'
  return '#E55'
}
function scoreBg(n: number) {
  if (n >= 80) return 'rgba(34,163,90,.12)'
  if (n >= 60) return 'rgba(214,154,18,.12)'
  return 'rgba(238,85,85,.12)'
}

/* ── メインコンポーネント ── */
export default function DashboardClient({ firstName }: { firstName: string }) {
  const [pageTab, setPageTab] = useState('動画編集')
  const [activeChip, setActiveChip] = useState('すべて')
  const [query, setQuery] = useState('')

  const [done, setDone] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('chance_done') ?? '[]') } catch { return [] }
  })
  const [saved, setSaved] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('chance_saved') ?? '[]') } catch { return [] }
  })

  /* thumbnail state */
  const [thumbPreview,  setThumbPreview]  = useState<string | null>(null)
  const [thumbFile,     setThumbFile]     = useState<File | null>(null)
  const [thumbDragging, setThumbDragging] = useState(false)
  const [thumbLoading,  setThumbLoading]  = useState(false)
  const [thumbFeedback, setThumbFeedback] = useState<Feedback | null>(null)
  const [thumbError,    setThumbError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  /* video modal */
  const [videoModal, setVideoModal] = useState<{ src: string; title: string; id?: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  async function openVideo(v: { id?: number; videoKey?: string; title: string }) {
    if (!v.videoKey) return
    try {
      const res = await fetch(`/api/video-url?key=${encodeURIComponent(v.videoKey)}`)
      const data = await res.json()
      if (!res.ok || !data.url) return
      setVideoModal({ src: data.url, title: v.title, id: v.id })
    } catch { /* silent */ }
  }
  function closeVideo() {
    if (videoRef.current) videoRef.current.pause()
    setVideoModal(null)
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeVideo() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function toggleDone(id: number) {
    setDone(p => {
      const next = p.includes(id) ? p.filter(d => d !== id) : [...p, id]
      localStorage.setItem('chance_done', JSON.stringify(next))
      return next
    })
  }
  function toggleSaved(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    setSaved(p => {
      const next = p.includes(id) ? p.filter(s => s !== id) : [...p, id]
      localStorage.setItem('chance_saved', JSON.stringify(next))
      return next
    })
  }

  /* thumbnail handlers */
  function handleThumbFile(file: File) {
    if (!file.type.startsWith('image/')) { setThumbError('画像ファイルを選択してください'); return }
    if (file.size > 10 * 1024 * 1024) { setThumbError('ファイルサイズは10MB以下にしてください'); return }
    setThumbError(''); setThumbFeedback(null); setThumbFile(file)
    const reader = new FileReader()
    reader.onload = e => setThumbPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  function handleThumbDrop(e: React.DragEvent) {
    e.preventDefault(); setThumbDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleThumbFile(file)
  }
  async function analyzeThumb() {
    if (!thumbFile || !thumbPreview) return
    setThumbLoading(true); setThumbError(''); setThumbFeedback(null)
    try {
      const res = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: thumbPreview.split(',')[1], mimeType: thumbFile.type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setThumbError(data.error ?? '解析に失敗しました。しばらくしてから再度お試しください。')
      } else {
        setThumbFeedback(data.feedback)
      }
    } catch {
      setThumbError('解析に失敗しました。しばらくしてから再度お試しください。')
    }
    setThumbLoading(false)
  }
  function resetThumb() {
    setThumbPreview(null); setThumbFile(null)
    setThumbFeedback(null); setThumbError('')
  }

  /* filtered videos */
  const filteredVideos = VIDEOS.filter(v => {
    const q = query || (activeChip !== 'すべて' ? activeChip : '')
    if (!q) return true
    return v.title.includes(q) || v.tags.some(t => t.includes(q)) || (v.desc ?? '').includes(q)
  })

  /* last watched = first video with videoKey */
  const lastVideo = VIDEOS.find(v => v.videoKey)

  return (
    <>
      {/* Welcome */}
      <div className="ds-welcome">
        <h1 className="ds-h1">おかえりなさい、<span className="ds-h1-name">{firstName}</span>さん 👋</h1>
        <p className="ds-sub">今日も学習を続けて、着実にスキルアップしていきましょう。</p>
      </div>

      {/* Page tabs */}
      <div className="ds-page-tabs">
        {PAGE_TABS.map(tab => (
          <button
            key={tab}
            className={`ds-page-tab${pageTab === tab ? ' active' : ''}`}
            onClick={() => setPageTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search + category chips */}
      <div className="ds-search-row">
        <div className="ds-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="学びたい内容を検索（例：テロップ、アニメーション）"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveChip('すべて') }}
          />
        </div>
      </div>
      <div className="ds-chips-row">
        {CATEGORY_CHIPS.map(chip => (
          <button
            key={chip}
            className={`ds-chip${activeChip === chip && !query ? ' active' : ''}`}
            onClick={() => { setActiveChip(chip); setQuery('') }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 2-column grid */}
      <div className="ds-grid">
        {/* Left column */}
        <div className="ds-col-left">

          {/* 前回の続きカード */}
          {lastVideo && (
            <div className="ds-resume-card">
              <div className="ds-resume-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                前回の続き
              </div>
              <div
                className="ds-resume-thumb"
                style={{ background: lastVideo.bg ?? 'linear-gradient(160deg,#12193a,#1e2d60)' }}
                onClick={() => openVideo(lastVideo)}
              >
                <span className="ds-resume-emoji">{lastVideo.emoji ?? '🎬'}</span>
                <div className="ds-resume-play-btn">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              <div className="ds-resume-info">
                <div className="ds-resume-title">{lastVideo.title}</div>
                <div className="ds-resume-desc">{lastVideo.desc}</div>
                <button className="ds-resume-btn" onClick={() => openVideo(lastVideo)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  続きから再生する
                </button>
              </div>
            </div>
          )}

          {/* サムネ添削カード */}
          <div className="ds-thumb-card">
            <div className="ds-thumb-card-hd">
              <div className="ds-thumb-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                サムネ添削
              </div>
              <span className="ds-ai-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                AI分析
              </span>
            </div>
            <p className="ds-thumb-card-desc">AIがあなたのサムネイルを即座に分析し、改善点をお伝えします。</p>

            {thumbFeedback ? (
              <div style={{ animation:'dsfadeInUp .4s ease' }}>
                {/* スコア */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                  {[
                    { label:'総合点数', score:thumbFeedback.totalScore, feedback:thumbFeedback.overall },
                    { label:'デザイン', score:thumbFeedback.designScore, feedback:thumbFeedback.designFeedback },
                    { label:'文言・テキスト', score:thumbFeedback.textScore, feedback:thumbFeedback.textFeedback },
                  ].map(s => (
                    <div key={s.label} style={{ background:scoreBg(s.score), borderRadius:'14px', padding:'14px 12px', border:`1px solid ${scoreColor(s.score)}40`, textAlign:'center' }}>
                      <div style={{ font:'800 32px var(--ds-disp)', color:scoreColor(s.score), lineHeight:1 }}>{s.score}</div>
                      <div style={{ font:'500 10px var(--ds-sans)', color:'var(--ds-text-sub)', margin:'2px 0 5px' }}>/ 100</div>
                      <div style={{ font:'700 11px var(--ds-sans)', color:'var(--ds-text-body)', marginBottom:'6px' }}>{s.label}</div>
                      <div style={{ font:'400 10px/1.6 var(--ds-sans)', color:'var(--ds-text-sub)', textAlign:'left' }}>{s.feedback}</div>
                    </div>
                  ))}
                </div>
                {/* ポイント */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                  {thumbFeedback.points.map((p, i) => (
                    <div key={i} style={{ background:'var(--ds-bg-card)', borderRadius:'10px', padding:'10px 12px', border:`1px solid ${p.type==='good'?'rgba(34,163,90,.25)':'rgba(22,119,255,.25)'}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
                        <span style={{ width:'16px', height:'16px', borderRadius:'50%', background:p.type==='good'?'rgba(34,163,90,.15)':'rgba(22,119,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', flexShrink:0, color:p.type==='good'?'#22A35A':'#1677FF' }}>
                          {p.type==='good'?'✓':'↑'}
                        </span>
                        <span style={{ font:'700 10px var(--ds-sans)', color:p.type==='good'?'#22A35A':'#1677FF' }}>{p.label}</span>
                      </div>
                      <p style={{ font:'400 10px/1.7 var(--ds-sans)', color:'var(--ds-text-sub)' }}>{p.comment}</p>
                    </div>
                  ))}
                </div>
                {/* 総括 */}
                <div style={{ background:'rgba(139,92,246,.08)', borderRadius:'12px', padding:'14px 16px', marginBottom:'12px', border:'1px solid rgba(139,92,246,.2)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'linear-gradient(135deg,#8B5CF6,#A855F7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </div>
                    <span style={{ font:'700 11px var(--ds-sans)', color:'var(--ds-text-main)' }}>総括</span>
                  </div>
                  <p style={{ font:'400 11px/1.8 var(--ds-sans)', color:'var(--ds-text-body)' }}>{thumbFeedback.overall}</p>
                </div>
                <button onClick={resetThumb} style={{ padding:'7px 18px', borderRadius:'50px', background:'rgba(148,163,184,.1)', color:'var(--ds-text-sub)', font:'600 11px var(--ds-sans)', cursor:'pointer', border:'1px solid var(--ds-border)' }}>
                  別のサムネイルを分析する
                </button>
              </div>
            ) : !thumbPreview ? (
              /* Drop zone */
              <div
                className={`ds-thumb-drop${thumbDragging ? ' dragging' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setThumbDragging(true) }}
                onDragLeave={() => setThumbDragging(false)}
                onDrop={handleThumbDrop}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                </svg>
                <div className="ds-thumb-drop-main">画像をドラッグ＆ドロップ</div>
                <div className="ds-thumb-drop-sub">またはクリックしてアップロード</div>
                <div className="ds-thumb-drop-note">JPG / PNG・最大10MB</div>
                {thumbError && <p style={{ font:'500 11px var(--ds-sans)', color:'#EF4444', marginTop:'6px' }}>{thumbError}</p>}
              </div>
            ) : (
              /* Preview */
              <div>
                <div style={{ aspectRatio:'16/9', borderRadius:'10px', overflow:'hidden', width:'100%', marginBottom:'10px' }}>
                  <img src={thumbPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button
                    onClick={analyzeThumb} disabled={thumbLoading}
                    style={{ flex:1, padding:'10px', borderRadius:'10px', background:thumbLoading?'rgba(148,163,184,.1)':'linear-gradient(135deg,#8B5CF6,#A855F7)', color:thumbLoading?'var(--ds-text-muted)':'#fff', font:'700 12px var(--ds-sans)', cursor:thumbLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', border:'none', transition:'all .2s' }}
                  >
                    {thumbLoading ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'dsSpin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>分析中...</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>AIで分析する</>
                    )}
                  </button>
                  <button onClick={resetThumb} style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(148,163,184,.1)', color:'var(--ds-text-sub)', font:'600 11px var(--ds-sans)', cursor:'pointer', border:'1px solid var(--ds-border)' }}>
                    やり直す
                  </button>
                </div>
                {thumbError && <p style={{ font:'500 11px var(--ds-sans)', color:'#EF4444', marginTop:'6px' }}>{thumbError}</p>}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { if (e.target.files?.[0]) handleThumbFile(e.target.files[0]) }}/>
          </div>
        </div>

        {/* Right column */}
        <div className="ds-col-right">

          {/* カテゴリカード横スクロール */}
          <div className="ds-cats-section">
            <div className="ds-section-hd">
              <span className="ds-section-title">カテゴリ</span>
            </div>
            <div className="ds-cats-scroll">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  className="ds-cat-card"
                  style={{ '--cat-color': cat.color } as React.CSSProperties}
                  onClick={() => { setActiveChip(cat.label); setQuery('') }}
                >
                  <span className="ds-cat-emoji">{cat.emoji}</span>
                  <span className="ds-cat-label">{cat.label}</span>
                  <span className="ds-cat-desc">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* コース動画セクション */}
          <div className="ds-videos-section">
            <div className="ds-section-hd">
              <span className="ds-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ds-blue)" strokeWidth="2" strokeLinecap="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                コース動画
              </span>
              <Link href="#" className="ds-section-link">
                すべて見る <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>

            <div className="ds-vgrid">
              {filteredVideos.length === 0 ? (
                <div style={{ padding:'24px 0', color:'var(--ds-text-muted)', font:'500 13px var(--ds-sans)' }}>該当する動画がありません</div>
              ) : (
                filteredVideos.map(v => (
                  <div
                    key={v.id}
                    className={`ds-vcard${v.videoKey ? ' playable' : ''}`}
                    onClick={() => v.videoKey ? openVideo({ id:v.id, videoKey:v.videoKey, title:v.title }) : toggleDone(v.id)}
                  >
                    <div className="ds-vcard-thumb">
                      <div className="ds-vcard-thumb-bg" style={{ background: v.bg ?? 'linear-gradient(160deg,#12193a,#1e2d60)' }}>
                        <span style={{ fontSize:'28px', opacity:.18 }}>{v.emoji}</span>
                      </div>
                      {/* status badge */}
                      {v.status === 'recommend' && !done.includes(v.id) && (
                        <span className="ds-vcard-badge recommend">おすすめ</span>
                      )}
                      {done.includes(v.id) && (
                        <span className="ds-vcard-badge done">視聴済み</span>
                      )}
                      {v.status === 'unwatched' && !done.includes(v.id) && (
                        <span className="ds-vcard-badge unwatched">未視聴</span>
                      )}
                      {v.videoKey && (
                        <div className="ds-vcard-play">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      )}
                      <button
                        className={`ds-vcard-bm${saved.includes(v.id) ? ' saved' : ''}`}
                        onClick={e => toggleSaved(v.id, e)}
                        title="お気に入り"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill={saved.includes(v.id)?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                        </svg>
                      </button>
                      <span className="ds-vcard-dur">{v.dur ?? '準備中'}</span>
                    </div>
                    <div className="ds-vcard-info">
                      <div className="ds-vcard-title" style={{ color:done.includes(v.id)?'var(--ds-blue-bright)':undefined }}>
                        {done.includes(v.id) && '✓ '}{v.title}
                      </div>
                      <div className="ds-vcard-desc">{v.desc}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 動画モーダル */}
      {videoModal && (
        <div className="ds-vmodal-overlay" onClick={closeVideo}>
          <div className="ds-vmodal-box" onClick={e => e.stopPropagation()}>
            <div className="ds-vmodal-hdr">
              <span className="ds-vmodal-title">{videoModal.title}</span>
              <button className="ds-vmodal-close" onClick={closeVideo} title="閉じる">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <video
              ref={videoRef}
              src={videoModal.src}
              controls
              autoPlay
              controlsList="nodownload"
              onContextMenu={e => e.preventDefault()}
              onEnded={() => {
                if (videoModal.id && !done.includes(videoModal.id)) toggleDone(videoModal.id)
              }}
              className="ds-vmodal-video"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes dsSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes dsVmodalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes dsFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes dsSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dsPlayPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}}
        .ds-vcard.playable:hover .ds-vcard-play{opacity:1}
        .ds-vmodal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(3,8,20,.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:dsFadeIn .2s ease}
        .ds-vmodal-box{background:var(--ds-bg-section);border-radius:20px;overflow:hidden;width:100%;max-width:900px;box-shadow:0 32px 80px rgba(0,0,0,.7);animation:dsVmodalIn .25s ease;border:1px solid var(--ds-border)}
        .ds-vmodal-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--ds-bg-card);border-bottom:1px solid var(--ds-border)}
        .ds-vmodal-title{font:700 14px var(--ds-sans);color:var(--ds-text-main);flex:1;margin-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ds-vmodal-close{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:rgba(148,163,184,.1);color:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;transition:all .2s;cursor:pointer;border:none}
        .ds-vmodal-close:hover{background:rgba(239,68,68,.7);color:#fff}
        .ds-vmodal-video{width:100%;display:block;max-height:70vh;background:#000;outline:none}
      `}</style>
    </>
  )
}
