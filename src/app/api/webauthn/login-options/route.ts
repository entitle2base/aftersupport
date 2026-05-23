import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const admin = createAdminClient()
  const url = new URL(request.url)
  const rpID = url.hostname

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    // allowCredentials を指定しない = ディスカバラブルクレデンシャル（メール不要）
  })

  const { data: challengeRecord, error } = await admin
    .from('webauthn_challenges')
    .insert({ challenge: options.challenge, type: 'authenticate' })
    .select('id')
    .single()

  if (error || !challengeRecord) {
    return NextResponse.json({ error: 'チャレンジの生成に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ options, challengeId: challengeRecord.id })
}
