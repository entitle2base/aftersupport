import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: Request) {
  const { image, mimeType } = await request.json()
  if (!image) return NextResponse.json({ error: 'image required' }, { status: 400 })

  // APIキー未設定の場合はモックレスポンス
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-xxx') {
    return NextResponse.json({
      feedback: {
        totalScore: 72,
        designScore: 75,
        textScore: 68,
        designFeedback: 'カラーバランスと構図は良好ですが、視線誘導をより意識するとさらに効果的です。',
        textFeedback: 'フォントの選択は適切ですが、サイズと配置にまだ改善の余地があります。',
        overall: '全体的にバランスの取れたサムネイルです。色使いと構図は視線を引きつける効果がありますが、テキストの視認性をさらに高めることで、クリック率の向上が期待できます。（※これはデモ表示です。APIキーを設定すると実際の添削が届きます）',
        points: [
          { label: '色使いとコントラスト', comment: '背景色とテキストのコントラストが取れており、視認性は良好です。', type: 'good' },
          { label: '構図・レイアウト', comment: '主役の配置が中央寄りで安定感があります。余白も適切です。', type: 'good' },
          { label: 'タイトルテキスト', comment: 'フォントサイズをもう少し大きくすると、スマートフォン閲覧時の視認性が上がります。', type: 'improve' },
          { label: 'インパクト・訴求力', comment: '視聴者が「見たい」と感じるキャッチコピーをタイトルに加えるとクリック率が改善します。', type: 'improve' },
        ],
      },
    })
  }

  // GPT-4o 本番実装
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `あなたはYouTubeサムネイルのデザイン専門家です。
動画編集スクールの受講生のサムネイルを採点・添削してください。
必ず以下のJSON形式のみで回答してください（余計な文章は不要）:
{
  "totalScore": 0〜100の整数（総合評価）,
  "designScore": 0〜100の整数（デザイン・ビジュアル評価）,
  "textScore": 0〜100の整数（文言・テキスト評価）,
  "designFeedback": "デザインについての1〜2文の短評",
  "textFeedback": "文言・テキストについての1〜2文の短評",
  "overall": "総括コメント（2〜3文）",
  "points": [
    { "label": "項目名", "comment": "具体的コメント", "type": "good" または "improve" }
  ]
}
goodを2〜3個、improveを2〜3個含めてください。
採点基準：デザインは色・コントラスト・構図・視線誘導、文言はフォント・読みやすさ・訴求力を評価してください。`,
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}`, detail: 'high' } },
              { type: 'text', text: 'このサムネイルを採点・添削してください。' },
            ],
          },
        ],
      }),
    })

    const data = await response.json()

    // OpenAI APIエラーの詳細ログ
    if (!response.ok) {
      console.error('[thumbnail] OpenAI API error:', JSON.stringify(data))
      const errMsg = data.error?.message || 'OpenAI API error'
      return NextResponse.json({ error: errMsg }, { status: 502 })
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('[thumbnail] No content in response:', JSON.stringify(data))
      throw new Error('No response')
    }

    // JSONのみ抽出（```json ... ``` の形式にも対応）
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid JSON')
    const feedback = JSON.parse(jsonMatch[0])
    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('[thumbnail] error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
