import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import '@/app/chance.css'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 管理者メールアドレス（ここに橋本さんのメールを追加）
const ADMIN_EMAILS = [
  'chaoben3103@gmail.com',
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/portal')
  }

  // 会員の質問のみ取得（AIの返答は除く）
  const { data: logs } = await supabaseAdmin
    .from('ai_chat_logs')
    .select('id, user_id, content, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(200)

  // メールアドレスを取得
  const userIds = [...new Set((logs ?? []).map(l => l.user_id))]
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  // 質問のキーワード集計（単語ごとに何回出てきたか）
  const wordCount: Record<string, number> = {}
  const keywords = ['テロップ', 'カット', 'BGM', '書き出し', 'エラー', 'フリーズ', '重い', 'エフェクト', 'トランジション', 'キーフレーム', '色補正', 'アニメーション', 'Premiere', 'Adobe']
  for (const log of logs ?? []) {
    for (const kw of keywords) {
      if (log.content.includes(kw)) {
        wordCount[kw] = (wordCount[kw] ?? 0) + 1
      }
    }
  }
  const sortedKeywords = Object.entries(wordCount).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <header className="hdr">
        <div className="hdr-in">
          <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--dk)' }}>
            管理者ページ
          </div>
          <div style={{ font: '500 12px var(--sans)', color: 'var(--gy)' }}>
            {user.email}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>

        {/* 統計サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px', marginBottom: '32px' }}>
          {[
            { label: '総質問数', value: logs?.length ?? 0, unit: '件' },
            { label: '質問したユーザー数', value: userIds.length, unit: '人' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--wh)', borderRadius: '16px', padding: '20px 22px',
              boxShadow: 'var(--shadow)', border: '1px solid var(--bd)',
            }}>
              <div style={{ font: '500 12px var(--sans)', color: 'var(--gy)', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ font: '900 28px var(--disp)', color: 'var(--pk)' }}>
                {s.value}<span style={{ font: '600 14px var(--sans)', color: 'var(--gy)', marginLeft: '4px' }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* キーワード頻度 */}
        {sortedKeywords.length > 0 && (
          <div style={{
            background: 'var(--wh)', borderRadius: '18px', padding: '22px 24px',
            boxShadow: 'var(--shadow)', border: '1px solid var(--bd)', marginBottom: '28px',
          }}>
            <h2 style={{ font: '800 15px var(--sans)', color: 'var(--dk)', marginBottom: '16px' }}>
              よく質問されているキーワード
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {sortedKeywords.map(([kw, count]) => (
                <div key={kw} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'var(--pk-l)', borderRadius: '50px',
                  padding: '6px 14px', border: '1px solid rgba(37,99,235,.15)',
                }}>
                  <span style={{ font: '700 13px var(--sans)', color: 'var(--pk)' }}>{kw}</span>
                  <span style={{
                    background: 'var(--pk)', color: '#fff',
                    borderRadius: '50px', padding: '1px 7px',
                    font: '700 10px var(--sans)',
                  }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 質問一覧 */}
        <div style={{
          background: 'var(--wh)', borderRadius: '18px',
          boxShadow: 'var(--shadow)', border: '1px solid var(--bd)', overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bd)' }}>
            <h2 style={{ font: '800 15px var(--sans)', color: 'var(--dk)' }}>
              質問ログ（最新200件）
            </h2>
          </div>
          {(logs ?? []).length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', font: '500 14px var(--sans)', color: 'var(--gy)' }}>
              まだ質問がありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(logs ?? []).map((log, i) => {
                const profile = profileMap[log.user_id]
                const date = new Date(log.created_at)
                const dateStr = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`
                return (
                  <div key={log.id} style={{
                    padding: '16px 24px',
                    borderBottom: i < (logs?.length ?? 0) - 1 ? '1px solid var(--bd)' : 'none',
                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,var(--pk),var(--co))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', font: '700 12px var(--disp)',
                    }}>
                      {(profile?.full_name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ font: '700 12px var(--sans)', color: 'var(--dk)' }}>
                          {profile?.full_name ?? profile?.email ?? '不明'}
                        </span>
                        <span style={{ font: '400 11px var(--sans)', color: 'var(--gy)' }}>{dateStr}</span>
                      </div>
                      <div style={{ font: '400 13px/1.6 var(--sans)', color: 'var(--dk2)' }}>
                        {log.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
