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

/* ── データ ── */
const CHIPS = ['すべて', '動画編集', 'SNS運用', 'AI活用', 'カット', 'テロップ', 'BGM・SE', 'エフェクト', 'アニメーション', '書き出し']
const TABS  = ['すべて', '未完了', '完了済み', 'お気に入り']

const VIDEOS = [
  { id:1,  title:'テロップをカッコよく見せる3要素', desc:'視聴者の目を引くテロップデザインの3つのポイントを解説', dur:'実演', bg:'linear-gradient(160deg,#12193a,#1e2d60)', emoji:'Aa',  tags:['テロップ'], src:'/videos/テロップをカッコよく見せる3要素.mp4' },
  { id:2,  title:'プレミアプロ画面配置',            desc:'Premiere Proの最適な作業環境・画面レイアウトを整える', dur:'実演', bg:'linear-gradient(160deg,#101a10,#1a2e1a)', emoji:'🎬', tags:['動画編集'], src:'/videos/プレミアプロ画面配置.mp4' },
  { id:3,  title:'カット編集の基本',         desc:'不要な部分をカットし、テンポの良い映像を作る',    dur:'準備中', bg:'linear-gradient(160deg,#0a1628,#162a50)', emoji:'✂️',  tags:['カット'] },
  { id:4,  title:'BGM・SEの選び方',           desc:'シーンに合った音楽・効果音の選び方',              dur:'準備中', bg:'linear-gradient(160deg,#0d1f1a,#142e25)', emoji:'🎵',  tags:['BGM・SE'] },
  { id:5,  title:'撮影の基本設定',             desc:'高品質な映像を撮るためのカメラ設定',              dur:'準備中', bg:'linear-gradient(160deg,#1a1030,#2d1a50)', emoji:'📷',  tags:['動画編集'] },
  { id:6,  title:'キーフレームアニメーション', desc:'動きのある表現を基本から学ぶ',                    dur:'準備中', bg:'linear-gradient(160deg,#0f1a35,#1c2e5e)', emoji:'🌀',  tags:['アニメーション'] },
  { id:7,  title:'テロップアニメーション応用', desc:'印象的な動くテロップを作成する',                  dur:'準備中', bg:'linear-gradient(160deg,#1a1540,#2d256b)', emoji:'💫',  tags:['テロップ','アニメーション'] },
  { id:8,  title:'トランジション基本',         desc:'シーン切り替えを自然に演出する',                  dur:'準備中', bg:'linear-gradient(160deg,#1a0d20,#30163a)', emoji:'✨',  tags:['エフェクト'] },
  { id:9,  title:'書き出し・エラー対処法',     desc:'高品質な書き出しとエラー解決法',                  dur:'準備中', bg:'linear-gradient(160deg,#1a0808,#3a1010)', emoji:'🐛',  tags:['書き出し'] },
  { id:10, title:'音量バランスとダッキング',   desc:'聴きやすい音声ミックスのテクニック',              dur:'準備中', bg:'linear-gradient(160deg,#0a1a2a,#102840)', emoji:'🎧',  tags:['BGM・SE'] },
]

const THUMB_HISTORY = [
  { title:'YouTube動画のサムネイル案',   date:'2025/05/11', status:'waiting' as const, bg:'linear-gradient(135deg,#1a1a3a,#2a2a5a)', feedback:'タイトルのフォントが読みにくい可能性があります。コントラスト比の改善を検討してください。' },
  { title:'新企画のサムネイル',           date:'2025/05/15', status:'replied' as const, bg:'linear-gradient(135deg,#1a2a1a,#1a3a2a)', feedback:'色のコントラストが良く視認性が高いです。背景とテキストのバランスも優れています。' },
  { title:'チャンネル登録を促すデザイン', date:'2025/05/13', status:'replied' as const, bg:'linear-gradient(135deg,#1a1020,#2a1a35)', feedback:'構図がバランスよく主役が明確です。テキストをもう少し大きくするとさらに効果的です。' },
]

/* スコアカラー */
function scoreColor(n: number) {
  if (n >= 80) return '#22A35A'
  if (n >= 60) return '#D69A12'
  return '#E55'
}
function scoreBg(n: number) {
  if (n >= 80) return '#EAF8EF'
  if (n >= 60) return '#FFF4D8'
  return '#FEF2F2'
}

/* ── メインコンポーネント ── */
export default function DashboardClient({ firstName }: { firstName: string }) {
  const [activeChip, setActiveChip] = useState('すべて')
  const [activeTab,  setActiveTab]  = useState('すべて')
  const [done,  setDone]  = useState<number[]>([])
  const [saved, setSaved] = useState<number[]>([])
  const [query, setQuery] = useState('')

  const [thumbPreview,  setThumbPreview]  = useState<string | null>(null)
  const [thumbFile,     setThumbFile]     = useState<File | null>(null)
  const [thumbDragging, setThumbDragging] = useState(false)
  const [thumbLoading,  setThumbLoading]  = useState(false)
  const [thumbFeedback, setThumbFeedback] = useState<Feedback | null>(null)
  const [thumbError,    setThumbError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── 動画モーダル ── */
  const [videoModal, setVideoModal] = useState<{ src: string; title: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  function openVideo(v: { src?: string; title: string }) {
    if (!v.src) return
    setVideoModal({ src: v.src, title: v.title })
  }
  function closeVideo() {
    if (videoRef.current) { videoRef.current.pause() }
    setVideoModal(null)
  }

  // Escキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeVideo() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const completionRate = Math.round((done.length / VIDEOS.length) * 100)

  const filteredVideos = VIDEOS.filter(v => {
    if (activeTab === '完了済み')   return done.includes(v.id)
    if (activeTab === '未完了')     return !done.includes(v.id)
    if (activeTab === 'お気に入り') return saved.includes(v.id)
    const q = query || (activeChip !== 'すべて' ? activeChip : '')
    if (!q) return true
    return v.title.includes(q) || v.tags.some(t => t.includes(q)) || v.desc.includes(q)
  })

  function toggleDone(id: number)  { setDone(p  => p.includes(id) ? p.filter(d => d !== id) : [...p, id]) }
  function toggleSaved(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    setSaved(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])
  }

  function handleThumbFile(file: File) {
    if (!file.type.startsWith('image/')) { setThumbError('画像ファイルを選択してください'); return }
    if (file.size > 10 * 1024 * 1024)   { setThumbError('ファイルサイズは10MB以下にしてください'); return }
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
      if (!res.ok) throw new Error()
      const data = await res.json()
      setThumbFeedback(data.feedback)
    } catch {
      setThumbError('解析に失敗しました。しばらくしてから再度お試しください。')
    }
    setThumbLoading(false)
  }
  function resetThumb() {
    setThumbPreview(null); setThumbFile(null)
    setThumbFeedback(null); setThumbError('')
  }

  return (
    <>
      {/* Welcome */}
      <div className="d-welcome">
        <h1 className="d-h1">おかえりなさい、<em>{firstName}</em>さん 👋</h1>
        <p className="d-sub">今日も学習を続けて、着実にスキルアップしていきましょう。</p>
      </div>

      {/* Search */}
      <div className="srch">
        <div className="srch-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="学びたい内容を検索（例：テロップ、アニメーション、BGM など）"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveChip('すべて') }}
          />
        </div>
      </div>

      {/* Chips */}
      <div className="chips-row">
        {CHIPS.map(chip => (
          <button key={chip} className={`chip${activeChip === chip && !query ? ' active' : ''}`}
            onClick={() => { setActiveChip(chip); setQuery('') }}>
            {chip}
          </button>
        ))}
        <button className="chip-filter">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          フィルター
        </button>
      </div>

      {/* Top cards */}
      <div className="top-cards">
        {/* 進捗カード */}
        <div className="prog-card">
          <div className="prog-card-top">
            <span className="prog-card-title">動画編集コースの進捗</span>
            <a href="#videos" className="prog-card-link">
              詳細を見る <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
          <div className="prog-body">
            <div className="prog-circle-wrap">
              <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--pk-l)" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--pk)" strokeWidth="3"
                  strokeDasharray={`${completionRate} 100`} strokeLinecap="round"/>
              </svg>
              <div className="prog-circle-num">{completionRate}%</div>
            </div>
            <div>
              <div className="prog-count">{done.length}<span> / {VIDEOS.length} レッスン完了</span></div>
              <div className="prog-next">次のレッスン：<br/>テロップデザインの基本</div>
            </div>
          </div>
          <div className="prog-bar-row">
            <div className="prog-bar-bg"><div className="prog-bar-fill" style={{ width:`${completionRate}%` }}/></div>
          </div>
        </div>

        {/* コースカード（モバイルでは横スクロール） */}
        <div className="top-cards-courses">
          {[
            { cls:'cc-edit', ico:'🎬', title:'動画編集', sub:'10 レッスン', desc:'基礎から応用まで体系的に学ぶ' },
            { cls:'cc-sns',  ico:'📱', title:'SNS運用',  sub:'7 レッスン',  desc:'成果を出すSNS運用を学ぶ' },
            { cls:'cc-ai',   ico:'🤖', title:'AI活用',   sub:'6 レッスン',  desc:'AIを使って効率的に制作する' },
          ].map(c => (
            <div key={c.title} className={`course-card ${c.cls}`}>
              <div className="course-card-head">
                <div className="course-card-ico">{c.ico}</div>
                <div className="course-card-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
              <div className="course-card-body">
                <div className="course-card-title">{c.title}</div>
                <div className="course-card-sub">{c.sub}</div>
                <div className="course-card-desc">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── サムネイル添削 ── */}
      <div className="sect-card">
        <div className="sect-hd">
          <div className="sect-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            サムネイル添削
          </div>
          <Link href="/tools/thumbnail" className="sect-link">
            すべて見る <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
        <p className="sect-desc">AIがあなたのサムネイルを即座に分析し、改善点をお伝えします。</p>

        {/* ── 分析結果表示 ── */}
        {thumbFeedback ? (
          <div style={{ animation:'fadeInUp .4s ease' }}>
            {/* スコア3枚 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px' }}>
              {[
                { label:'総合点数', score:thumbFeedback.totalScore, feedback:thumbFeedback.overall },
                { label:'デザイン', score:thumbFeedback.designScore, feedback:thumbFeedback.designFeedback },
                { label:'文言・テキスト', score:thumbFeedback.textScore, feedback:thumbFeedback.textFeedback },
              ].map(s => (
                <div key={s.label} style={{ background:scoreBg(s.score), borderRadius:'16px', padding:'18px 16px', border:`1px solid ${scoreColor(s.score)}30`, textAlign:'center' }}>
                  <div style={{ font:'800 38px var(--disp)', color:scoreColor(s.score), lineHeight:1 }}>{s.score}</div>
                  <div style={{ font:'500 11px var(--sans)', color:'var(--gy)', margin:'2px 0 6px' }}>/ 100</div>
                  <div style={{ font:'700 12px var(--sans)', color:'var(--dk)', marginBottom:'8px' }}>{s.label}</div>
                  <div style={{ font:'400 11px/1.6 var(--sans)', color:'var(--dk2)', textAlign:'left' }}>{s.feedback}</div>
                </div>
              ))}
            </div>

            {/* 個別ポイント */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' }}>
              {thumbFeedback.points.map((p, i) => (
                <div key={i} style={{ background:'var(--wh)', borderRadius:'12px', padding:'12px 14px', border:`1px solid ${p.type==='good'?'rgba(34,163,90,.2)':'rgba(47,107,255,.15)'}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                    <span style={{ width:'18px', height:'18px', borderRadius:'50%', background:p.type==='good'?'rgba(34,163,90,.12)':'rgba(47,107,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', flexShrink:0, color:p.type==='good'?'var(--gr)':'var(--pk)' }}>
                      {p.type==='good'?'✓':'↑'}
                    </span>
                    <span style={{ font:`700 11px var(--sans)`, color:p.type==='good'?'var(--gr)':'var(--pk)' }}>{p.label}</span>
                  </div>
                  <p style={{ font:'400 11px/1.7 var(--sans)', color:'var(--dk2)' }}>{p.comment}</p>
                </div>
              ))}
            </div>

            {/* 総括 */}
            <div style={{ background:'linear-gradient(145deg,#0F172A,#1E293B)', borderRadius:'14px', padding:'18px 20px', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:'linear-gradient(135deg,var(--pk),var(--co))', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <span style={{ font:'700 12px var(--sans)', color:'#fff' }}>総括</span>
              </div>
              <p style={{ font:'400 12px/1.8 var(--sans)', color:'rgba(255,255,255,.82)' }}>{thumbFeedback.overall}</p>
            </div>

            <button onClick={resetThumb} style={{ padding:'8px 20px', borderRadius:'50px', background:'#F1F5F9', color:'var(--dk2)', font:'600 12px var(--sans)', cursor:'pointer' }}>
              別のサムネイルを分析する
            </button>
          </div>
        ) : (
          /* ── アップロードUI ── */
          <div className="thumb-body">
            <div>
              {!thumbPreview ? (
                /* ドロップエリア（16:10） */
                <div
                  className="thumb-upload"
                  style={{ borderColor:thumbDragging?'var(--pk)':undefined, background:thumbDragging?'var(--pk-l)':undefined }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setThumbDragging(true) }}
                  onDragLeave={() => setThumbDragging(false)}
                  onDrop={handleThumbDrop}
                >
                  <div className="thumb-upload-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                    </svg>
                  </div>
                  <div className="thumb-upload-main">画像をドラッグ＆ドロップ</div>
                  <div className="thumb-upload-sub">またはクリックしてアップロード</div>
                  <div className="thumb-upload-note">対応形式：JPG, PNG（最大10MB）</div>
                  <div className="thumb-upload-label">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    AIが即座に分析します
                  </div>
                </div>
              ) : (
                /* プレビュー（16:9）＋ボタン */
                <div>
                  <div style={{ aspectRatio:'16/9', borderRadius:'12px', overflow:'hidden', width:'100%', marginBottom:'10px', position:'relative' }}>
                    <img src={thumbPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button
                      onClick={analyzeThumb} disabled={thumbLoading}
                      style={{ flex:1, padding:'11px', borderRadius:'10px', background:thumbLoading?'#F1F5F9':'linear-gradient(135deg,var(--pk),var(--co))', color:thumbLoading?'var(--gy)':'#fff', font:'700 13px var(--sans)', cursor:thumbLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all .2s' }}
                    >
                      {thumbLoading ? (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>分析中...</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>AIで分析する</>
                      )}
                    </button>
                    <button onClick={resetThumb} style={{ padding:'11px 16px', borderRadius:'10px', background:'#F1F5F9', color:'var(--dk2)', font:'600 12px var(--sans)', cursor:'pointer' }}>
                      やり直す
                    </button>
                  </div>
                  {thumbError && <p style={{ font:'500 11px var(--sans)', color:'#DC2626', marginTop:'6px' }}>{thumbError}</p>}
                </div>
              )}
              {thumbError && !thumbPreview && <p style={{ font:'500 11px var(--sans)', color:'#DC2626', marginTop:'6px' }}>{thumbError}</p>}
            </div>

            {/* 添削履歴（分析前のみ表示） */}
            <div className="thumb-history">
              <div className="thumb-history-title">最近の添削履歴</div>
              <div>
                {THUMB_HISTORY.map((item, i) => (
                  <div key={i} className="thumb-history-item">
                    <div className="thumb-history-img" style={{ background:item.bg }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div className="thumb-history-info">
                      <div className="thumb-history-name">{item.title}</div>
                      <div style={{ font:'400 11px/1.5 var(--sans)', color:'var(--gy2)', marginTop:'2px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>{item.feedback}</div>
                      <div className="thumb-history-date">{item.date}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', flexShrink:0 }}>
                      {item.status === 'waiting'
                        ? <span className="badge-waiting">添削待ち</span>
                        : <span className="badge-replied">返答あり</span>
                      }
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gy)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => { if (e.target.files?.[0]) handleThumbFile(e.target.files[0]) }}/>
      </div>

      {/* ── コース動画 ── */}
      <div className="sect-card" id="videos">
        <div className="sect-hd" style={{ marginBottom:'16px' }}>
          <div className="sect-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pk)" strokeWidth="2" strokeLinecap="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            コース動画
          </div>
          <a href="#" className="sect-link">
            コース一覧を見る <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>

        <div className="video-tabs">
          {TABS.map(tab => (
            <button key={tab} className={`video-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="video-grid">
          {filteredVideos.length === 0 ? (
            <div style={{ padding:'32px 0', color:'var(--gy)', font:'500 14px var(--sans)' }}>該当する動画がありません</div>
          ) : (
            filteredVideos.map(v => (
              <div key={v.id} className={`vcard${v.src ? ' vcard-playable' : ''}`}
                onClick={() => v.src ? openVideo(v) : toggleDone(v.id)}>
                <div className="vcard-thumb">
                  <div className="vcard-thumb-bg" style={{ background:v.bg }}>
                    <span style={{ fontSize:'32px', opacity:.18 }}>{v.emoji}</span>
                  </div>
                  {/* 再生ボタン（実動画のみ） */}
                  {v.src && (
                    <div className="vcard-play-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  )}
                  <button className={`vcard-bookmark${saved.includes(v.id)?' saved':''}`} onClick={e => toggleSaved(v.id, e)} title="お気に入り">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={saved.includes(v.id)?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                    </svg>
                  </button>
                  <span className="vcard-dur">{v.dur}</span>
                </div>
                <div className="vcard-info">
                  <div className="vcard-title" style={{ color:done.includes(v.id)?'var(--pk)':undefined }}>
                    {done.includes(v.id)&&'✓ '}{v.title}
                  </div>
                  <div className="vcard-desc">{v.desc}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 動画モーダル ── */}
      {videoModal && (
        <div className="vmodal-overlay" onClick={closeVideo}>
          <div className="vmodal-box" onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className="vmodal-hdr">
              <span className="vmodal-title">{videoModal.title}</span>
              <button className="vmodal-close" onClick={closeVideo} title="閉じる">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* 動画プレイヤー */}
            <video
              ref={videoRef}
              src={videoModal.src}
              controls
              autoPlay
              controlsList="nodownload"
              onContextMenu={e => e.preventDefault()}
              className="vmodal-video"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vmodalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        .vcard-playable:hover .vcard-play-btn{opacity:1;transform:translate(-50%,-50%) scale(1.1)}
        .vcard-play-btn{
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:44px;height:44px;border-radius:50%;
          background:rgba(47,107,255,.85);backdrop-filter:blur(4px);
          display:flex;align-items:center;justify-content:center;
          opacity:0;transition:all .2s;pointer-events:none;
          box-shadow:0 4px 16px rgba(47,107,255,.5);
        }
        .vcard-playable .vcard-dur{background:rgba(47,107,255,.9)}
        .vmodal-overlay{
          position:fixed;inset:0;z-index:1000;
          background:rgba(6,21,46,.85);backdrop-filter:blur(8px);
          display:flex;align-items:center;justify-content:center;
          padding:20px;animation:fadeIn .2s ease;
        }
        .vmodal-box{
          background:#0a1628;border-radius:20px;overflow:hidden;
          width:100%;max-width:900px;box-shadow:0 32px 80px rgba(0,0,0,.6);
          animation:vmodalIn .25s ease;
        }
        .vmodal-hdr{
          display:flex;align-items:center;justify-content:space-between;
          padding:16px 20px;background:#10213f;border-bottom:1px solid rgba(255,255,255,.08);
        }
        .vmodal-title{font:700 15px var(--sans);color:#fff;flex:1;margin-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .vmodal-close{
          width:36px;height:36px;border-radius:50%;flex-shrink:0;
          background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);
          display:flex;align-items:center;justify-content:center;
          transition:all .2s;cursor:pointer;border:none;
        }
        .vmodal-close:hover{background:rgba(239,68,68,.8);color:#fff}
        .vmodal-video{width:100%;display:block;max-height:70vh;background:#000;outline:none}
      `}</style>
    </>
  )
}
