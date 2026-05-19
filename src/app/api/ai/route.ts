import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { message } = await request.json()
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  // ログイン中のユーザーを取得
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // チャットログを保存（APIキー未設定でも保存する）
  if (user) {
    await supabaseAdmin.from('ai_chat_logs').insert({
      user_id: user.id,
      role: 'user',
      content: message,
    })
  }

  // APIキー未設定の場合はモックレスポンス
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'sk-ant-xxx') {
    const reply = '（AIチャット機能は現在準備中です。APIキーが設定されると実際の回答が届きます。）'
    if (user) {
      await supabaseAdmin.from('ai_chat_logs').insert({
        user_id: user.id,
        role: 'assistant',
        content: reply,
      })
    }
    return NextResponse.json({ reply })
  }

  // Claude APIを使った本番実装
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `あなたは動画編集スクールのAIサポートアシスタントです。
受講生からの動画編集（主にAdobe Premiere Pro）に関する質問に、丁寧かつ具体的に日本語で回答してください。
わからないことは正直に「わからない」と伝え、誤った情報を提供しないようにしてください。
回答は簡潔にまとめ、必要に応じて手順を番号付きで説明してください。`,
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await res.json()
    const reply = data.content?.[0]?.text ?? 'うまく回答を取得できませんでした。'

    if (user) {
      await supabaseAdmin.from('ai_chat_logs').insert({
        user_id: user.id,
        role: 'assistant',
        content: reply,
      })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[ai] error:', error)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
