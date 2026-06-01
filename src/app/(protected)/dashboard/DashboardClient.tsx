'use client'

import { useState, useRef, useEffect } from 'react'

/* ── DB型定義 ── */
type DbStep = {
  id: number
  section: 'core' | 'supplement'
  step_no: number | null
  title: string
  position: number
}
type DbVideo = {
  id: number
  step_id: number | null
  position: number
  title: string
  description: string | null
  video_key: string | null
  emoji: string | null
  bg_gradient: string | null
  plus_alpha: boolean
  tags: string[]
  is_published: boolean
}

interface Props {
  firstName: string
  steps: DbStep[]
  videos: DbVideo[]
  watchedIds: number[]
}

export default function DashboardClient({ firstName, steps, videos, watchedIds: initialWatched }: Props) {
  const [pageTab, setPageTab] = useState('動画編集')
  const [openSteps, setOpenSteps] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unwatched' | 'done'>('all')
  const [done, setDone] = useState<number[]>(initialWatched)

  const [saved, setSaved] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('chance_saved') ?? '[]') } catch { return [] }
  })

  /* video modal */
  const [videoModal, setVideoModal] = useState<{ src: string; title: string; id: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  async function openVideo(v: DbVideo) {
    if (!v.video_key) return
    try {
      const res = await fetch(`/api/video-url?key=${encodeURIComponent(v.video_key)}`)
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

  async function markWatched(videoId: number) {
    if (done.includes(videoId)) return
    setDone(p => [...p, videoId])
    // Supabaseに保存
    await fetch('/api/video-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
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

  function toggleStep(stepId: number) {
    setOpenSteps(p => p.includes(stepId) ? p.filter(s => s !== stepId) : [...p, stepId])
  }

  /* セクション別に動画を取得 */
  const coreSteps = steps.filter(s => s.section === 'core')
  const suppSteps = steps.filter(s => s.section === 'supplement')

  function videosForStep(stepId: number) {
    return videos.filter(v => v.step_id === stepId).sort((a, b) => a.position - b.position)
  }

  /* 進捗計算（基礎動画のみ） */
  const coreVideos = videos.filter(v => coreSteps.some(s => s.id === v.step_id))
  const watchedCount = done.filter(id => coreVideos.some(v => v.id === id)).length
  const totalVideos = coreVideos.length
  const progressPct = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0

  /* フィルタリング */
  const isSearching = !!query || statusFilter !== 'all'

  function filterVideos(vids: DbVideo[]) {
    if (!isSearching) return vids
    return vids.filter(v => {
      const matchesSearch = !query || v.title.includes(query) || v.tags.some(t => t.includes(query)) || (v.description ?? '').includes(query)
      const isDone = done.includes(v.id)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'done' && isDone) || (statusFilter === 'unwatched' && !isDone)
      return matchesSearch && matchesStatus
    })
  }

  const allVideosFlat = videos
  const filteredAll = filterVideos(allVideosFlat)

  const PAGE_TABS = [
    { label: '動画編集', coming: false },
    { label: 'SNS運用', coming: true },
    { label: 'AI活用', coming: true },
  ]

  function renderVideoRow(v: DbVideo, idx: number, stepId: number) {
    const isDone = done.includes(v.id)
    const isSaved = saved.includes(v.id)
    const canPlay = !!v.video_key

    return (
      <div
        key={v.id}
        className={`ds-step-vrow${isDone ? ' watched' : ''}${canPlay ? ' playable' : ''}`}
        onClick={() => {
          if (canPlay) openVideo(v)
          else if (!isDone) markWatched(v.id)
        }}
      >
        <div className="ds-step-vnum">
          {isDone
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#22A35A"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            : <span>{String(idx + 1).padStart(2, '0')}</span>
          }
        </div>
        <div className="ds-step-thumb" style={{ background: v.bg_gradient ?? 'linear-gradient(160deg,#12193a,#1e2d60)' }}>
          <span className="ds-step-thumb-emoji">{v.emoji}</span>
          {canPlay && (
            <div className="ds-step-play">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          )}
          {!canPlay && <div className="ds-step-coming-overlay">準備中</div>}
        </div>
        <div className="ds-step-vinfo">
          <div className="ds-step-vtitle">
            {v.title}
            {v.plus_alpha && <span className="ds-badge-plus">＋α</span>}
          </div>
          {v.description && <div className="ds-step-vdesc">{v.description}</div>}
          <div className="ds-step-vmeta">
            {v.tags.length > 1 && v.tags.map(t => (
              <span key={t} className="ds-step-vtag">{t}</span>
            ))}
            {!canPlay && <span style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>準備中</span>}
            {canPlay && <span className="ds-step-vdur">実演</span>}
            {isDone && <span className="ds-step-vbadge done">視聴済み</span>}
          </div>
        </div>
        <button
          className={`ds-step-bm${isSaved ? ' saved' : ''}`}
          onClick={e => toggleSaved(v.id, e)}
          title="お気に入り"
        >
          <svg width="13" height="13" viewBox="0 0 24 24"
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* ── Welcome + 進捗 ── */}
      <div className="ds-welcome">
        <h1 className="ds-h1">おかえりなさい、<span className="ds-h1-name">{firstName}</span>さん 👋</h1>
        <p className="ds-sub">今日も学習を続けて、着実にスキルアップしていきましょう。</p>

        {/* 進捗バー */}
        <div className="ds-progress-wrap">
          <div className="ds-progress-hd">
            <span className="ds-progress-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              学習進捗
            </span>
            <span className="ds-progress-count">
              {watchedCount > 0
                ? <><span className="ds-progress-num">{watchedCount}</span> / {totalVideos}本 視聴済み</>
                : <span style={{ color: 'var(--ds-text-muted)' }}>まだ視聴した動画がありません</span>
              }
            </span>
          </div>
          <div className="ds-progress-bar-bg">
            <div className="ds-progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          {watchedCount > 0 && (
            <div className="ds-progress-pct">{progressPct}% 完了</div>
          )}
        </div>
      </div>

      {/* ── Page tabs ── */}
      <div className="ds-page-tabs">
        {PAGE_TABS.map(tab => (
          <button
            key={tab.label}
            className={`ds-page-tab${pageTab === tab.label && !tab.coming ? ' active' : ''}${tab.coming ? ' coming' : ''}`}
            onClick={() => !tab.coming && setPageTab(tab.label)}
            disabled={tab.coming}
          >
            {tab.label}
            {tab.coming && <span className="ds-tab-coming-badge">準備中</span>}
          </button>
        ))}
      </div>

      {/* ── 検索 + ステータスフィルター ── */}
      <div className="ds-search-row">
        <div className="ds-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="動画タイトルを検索…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="ds-search-clear" onClick={() => setQuery('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="ds-status-filter" style={{ marginBottom: '20px' }}>
        {(['all', 'unwatched', 'done'] as const).map(s => (
          <button
            key={s}
            className={`ds-status-btn${statusFilter === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? '全て' : s === 'unwatched'
              ? <><span className="ds-status-dot ds-status-dot--unwatched"/>未視聴</>
              : <><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>視聴済み</>
            }
          </button>
        ))}
        {isSearching && (
          <span className="ds-filter-hint">{filteredAll.length}本 該当</span>
        )}
      </div>

      {/* ── 基礎動画セクション ── */}
      <div className="ds-section-label">基礎動画</div>
      <div className="ds-curriculum">
        {coreSteps.map(s => {
          const isOpen = openSteps.includes(s.id)
          const allVids = videosForStep(s.id)
          const vids = filterVideos(allVids)
          const stepDone = allVids.filter(v => done.includes(v.id)).length
          const stepTotal = allVids.length
          const stepPct = stepTotal > 0 ? Math.round((stepDone / stepTotal) * 100) : 0
          if (isSearching && vids.length === 0) return null

          return (
            <div key={s.id} className={`ds-step${isOpen ? ' open' : ''}`}>
              <button className="ds-step-hd" onClick={() => toggleStep(s.id)}>
                <div className="ds-step-hd-left">
                  <span className="ds-step-num">STEP {s.step_no}</span>
                  <span className="ds-step-title">{s.title}</span>
                </div>
                <div className="ds-step-hd-right">
                  <div className="ds-step-mini-progress">
                    <div className="ds-step-mini-bar">
                      <div className="ds-step-mini-fill" style={{ width: `${stepPct}%` }}/>
                    </div>
                    <span className="ds-step-mini-count">{stepDone}/{stepTotal}</span>
                  </div>
                  <svg className="ds-step-chevron" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .25s' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="ds-step-body">
                  {vids.map((v, idx) => renderVideoRow(v, idx, s.id))}
                </div>
              )}
            </div>
          )
        })}

        {isSearching && filteredAll.filter(v => coreSteps.some(s => s.id === v.step_id)).length === 0 && suppSteps.length === 0 && (
          <div className="ds-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>該当する動画がありません</p>
          </div>
        )}
      </div>

      {/* ── 応用・補足セクション ── */}
      <div className="ds-section-label" style={{ marginTop: 32 }}>応用・補足</div>
      <div className="ds-curriculum">
        {suppSteps.length === 0 ? (
          <div className="ds-supp-empty">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            準備中
          </div>
        ) : (
          suppSteps.map(s => {
            const isOpen = openSteps.includes(s.id)
            const allVids = videosForStep(s.id)
            const vids = filterVideos(allVids)
            if (isSearching && vids.length === 0) return null
            return (
              <div key={s.id} className={`ds-step ds-step--supp${isOpen ? ' open' : ''}`}>
                <button className="ds-step-hd" onClick={() => toggleStep(s.id)}>
                  <div className="ds-step-hd-left">
                    <span className="ds-step-num ds-step-num--supp">補足</span>
                    <span className="ds-step-title">{s.title}</span>
                  </div>
                  <div className="ds-step-hd-right">
                    <svg className="ds-step-chevron" width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .25s' }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="ds-step-body">
                    {vids.map((v, idx) => renderVideoRow(v, idx, s.id))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── 動画モーダル ── */}
      {videoModal && (
        <div className="ds-vmodal-overlay" onClick={closeVideo}>
          <div className="ds-vmodal-box" onClick={e => e.stopPropagation()}>
            <div className="ds-vmodal-hdr">
              <span className="ds-vmodal-title">{videoModal.title}</span>
              <button className="ds-vmodal-close" onClick={closeVideo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <video
              ref={videoRef}
              src={videoModal.src}
              controls autoPlay
              controlsList="nodownload"
              onContextMenu={e => e.preventDefault()}
              onEnded={() => markWatched(videoModal.id)}
              className="ds-vmodal-video"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes dsFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes dsSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dsVmodalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}

        /* セクションラベル */
        .ds-section-label{
          font:700 11px var(--ds-sans);
          color:var(--ds-text-muted);
          letter-spacing:.1em;
          text-transform:uppercase;
          margin-bottom:12px;
          display:flex;align-items:center;gap:8px;
        }
        .ds-section-label::after{
          content:'';flex:1;height:1px;
          background:var(--ds-border);
        }

        /* 準備中（応用・補足空状態） */
        .ds-supp-empty{
          display:flex;align-items:center;gap:8px;
          padding:20px 18px;
          background:var(--ds-bg-card);
          border:1px dashed var(--ds-border);
          border-radius:16px;
          color:var(--ds-text-muted);
          font:500 13px var(--ds-sans);
        }

        /* ＋α バッジ */
        .ds-badge-plus{
          display:inline-block;
          margin-left:6px;
          padding:1px 6px;border-radius:4px;
          background:rgba(168,85,247,.15);
          border:1px solid rgba(168,85,247,.3);
          color:#A855F7;
          font:700 9px var(--ds-sans);
          letter-spacing:.04em;
          vertical-align:middle;
        }

        /* タグ（複数カテゴリにまたがる動画用） */
        .ds-step-vtag{
          font:500 9px var(--ds-sans);
          padding:1px 6px;border-radius:4px;
          background:rgba(255,255,255,.06);
          color:var(--ds-text-muted);
          border:1px solid var(--ds-border);
        }

        /* 補足ステップのSTEP番号を別色に */
        .ds-step-num--supp{
          background:rgba(168,85,247,.1)!important;
          border-color:rgba(168,85,247,.25)!important;
          color:#A855F7!important;
        }

        /* カリキュラム */
        .ds-curriculum{display:flex;flex-direction:column;gap:10px}

        /* ステップ外枠 */
        .ds-step{
          background:var(--ds-bg-card);
          border:1px solid var(--ds-border);
          border-radius:16px;overflow:hidden;
          transition:border-color .2s;
        }
        .ds-step.open{border-color:var(--ds-border-blue)}

        /* ステップヘッダー */
        .ds-step-hd{
          width:100%;display:flex;align-items:center;
          justify-content:space-between;gap:12px;
          padding:16px 18px;cursor:pointer;
          background:none;border:none;text-align:left;
          transition:background .15s;
        }
        .ds-step-hd:hover{background:rgba(255,255,255,.03)}
        .ds-step.open .ds-step-hd{
          border-bottom:1px solid var(--ds-border);
          background:rgba(22,119,255,.04);
        }
        .ds-step-hd-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
        .ds-step-num{
          flex-shrink:0;
          padding:3px 10px;border-radius:50px;
          background:rgba(22,119,255,.12);
          border:1px solid rgba(22,119,255,.25);
          font:700 10px var(--ds-sans);color:var(--ds-blue-bright);
          letter-spacing:.08em;white-space:nowrap;
        }
        .ds-step.open .ds-step-num{
          background:rgba(22,119,255,.2);
          border-color:rgba(22,119,255,.4);
        }
        .ds-step-title{
          font:700 14px var(--ds-sans);color:var(--ds-text-main);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .ds-step-hd-right{display:flex;align-items:center;gap:10px;flex-shrink:0}

        /* ステップ内ミニ進捗 */
        .ds-step-mini-progress{display:flex;align-items:center;gap:7px}
        .ds-step-mini-bar{
          width:52px;height:4px;border-radius:50px;
          background:rgba(255,255,255,.08);overflow:hidden;
        }
        .ds-step-mini-fill{
          height:100%;border-radius:50px;
          background:linear-gradient(90deg,var(--ds-blue-active),var(--ds-blue));
          transition:width .5s;
        }
        .ds-step-mini-count{
          font:600 11px var(--ds-sans);color:var(--ds-text-muted);
          white-space:nowrap;
        }
        .ds-step-chevron{color:var(--ds-text-muted);flex-shrink:0}

        /* ステップ本体（動画リスト） */
        .ds-step-body{animation:dsSlideDown .2s ease}

        /* 動画行 */
        .ds-step-vrow{
          display:flex;align-items:center;gap:12px;
          padding:12px 18px;cursor:pointer;
          transition:background .15s;
          border-bottom:1px solid var(--ds-border);
        }
        .ds-step-vrow:last-child{border-bottom:none}
        .ds-step-vrow:hover{background:rgba(255,255,255,.03)}
        .ds-step-vrow.watched .ds-step-vtitle{color:var(--ds-blue-bright)}
        .ds-step-vrow.playable:hover .ds-step-play{opacity:1}

        /* 行番号 */
        .ds-step-vnum{
          width:22px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          font:700 11px var(--ds-disp);color:var(--ds-text-muted);
        }
        .ds-step-vrow.watched .ds-step-vnum{color:#22A35A}

        /* サムネイル */
        .ds-step-thumb{
          width:88px;flex-shrink:0;
          aspect-ratio:16/9;border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          position:relative;overflow:hidden;
        }
        .ds-step-thumb-emoji{font-size:20px;opacity:.2;user-select:none}
        .ds-step-play{
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
          background:rgba(22,119,255,.75);
          opacity:0;transition:opacity .2s;
        }
        .ds-step-coming-overlay{
          position:absolute;inset:0;
          display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,.5);
          font:700 9px var(--ds-sans);color:rgba(255,255,255,.6);
          letter-spacing:.05em;
        }

        /* テキスト情報 */
        .ds-step-vinfo{flex:1;min-width:0}
        .ds-step-vtitle{
          font:700 13px/1.4 var(--ds-sans);color:var(--ds-text-main);
          margin-bottom:2px;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
        }
        .ds-step-vdesc{
          font:400 11px/1.5 var(--ds-sans);color:var(--ds-text-muted);
          display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;
          margin-bottom:4px;
        }
        .ds-step-vmeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .ds-step-vdur{font:500 10px var(--ds-sans);color:var(--ds-text-sub)}
        .ds-step-vbadge{
          font:700 9px var(--ds-sans);
          padding:2px 7px;border-radius:4px;
        }
        .ds-step-vbadge.done{background:rgba(34,163,90,.15);color:#22A35A}
        .ds-step-vbadge.rec{background:rgba(168,85,247,.15);color:#A855F7}

        /* ブックマーク */
        .ds-step-bm{
          flex-shrink:0;width:28px;height:28px;border-radius:6px;
          background:rgba(255,255,255,.05);border:none;
          display:flex;align-items:center;justify-content:center;
          color:rgba(255,255,255,.4);cursor:pointer;transition:all .15s;
        }
        .ds-step-bm:hover,.ds-step-bm.saved{color:#FFD700;background:rgba(255,215,0,.1)}

        /* 検索クリアボタン */
        .ds-search-clear{
          position:absolute;right:14px;top:50%;transform:translateY(-50%);
          background:none;border:none;color:var(--ds-text-muted);
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          padding:4px;border-radius:50%;transition:color .15s;
        }
        .ds-search-clear:hover{color:var(--ds-text-body)}

        /* フィルター件数 */
        .ds-filter-hint{
          font:500 11px var(--ds-sans);color:var(--ds-text-muted);
          margin-left:4px;
        }

        /* 空状態 */
        .ds-empty{
          display:flex;flex-direction:column;align-items:center;gap:10px;
          padding:48px 20px;color:var(--ds-text-muted);
          font:500 13px var(--ds-sans);
        }

        /* モーダル */
        .ds-vmodal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(3,8,20,.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:dsFadeIn .2s ease}
        .ds-vmodal-box{background:var(--ds-bg-section);border-radius:20px;overflow:hidden;width:100%;max-width:900px;box-shadow:0 32px 80px rgba(0,0,0,.7);animation:dsVmodalIn .25s ease;border:1px solid var(--ds-border)}
        .ds-vmodal-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--ds-bg-card);border-bottom:1px solid var(--ds-border)}
        .ds-vmodal-title{font:700 14px var(--ds-sans);color:var(--ds-text-main);flex:1;margin-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ds-vmodal-close{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:rgba(148,163,184,.1);color:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;transition:all .2s;cursor:pointer;border:none}
        .ds-vmodal-close:hover{background:rgba(239,68,68,.7);color:#fff}
        .ds-vmodal-video{width:100%;display:block;max-height:70vh;background:#000;outline:none}

        /* モバイル調整 */
        @media(max-width:768px){
          .ds-step-hd{padding:14px 14px}
          .ds-step-vrow{padding:10px 14px;gap:10px}
          .ds-step-thumb{width:72px}
          .ds-step-vtitle{font-size:12px}
          .ds-step-vdesc{display:none}
          .ds-step-mini-bar{width:36px}
          .ds-step-title{font-size:13px}
        }
      `}</style>
    </>
  )
}
