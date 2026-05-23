import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_EMAIL = 'chaoben3103@gmail.com'

export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const admin = createAdminClient()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)

  if (authError || !user || user.email !== TEST_EMAIL) {
    return NextResponse.json({ error: 'この機能はテスト中です' }, { status: 403 })
  }

  const { data: existingCreds } = await admin
    .from('webauthn_credentials')
    .select('credential_id')
    .eq('user_id', user.id)

  const url = new URL(request.url)
  const rpID = url.hostname

  const options = await generateRegistrationOptions({
    rpName: 'After Support',
    rpID,
    userName: user.email!,
    userDisplayName: user.email!,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
      authenticatorAttachment: 'platform',
    },
    excludeCredentials: existingCreds?.map(c => ({
      id: c.credential_id,
    })) ?? [],
  })

  const { data: challengeRecord, error } = await admin
    .from('webauthn_challenges')
    .insert({ challenge: options.challenge, type: 'register', email: user.email })
    .select('id')
    .single()

  if (error || !challengeRecord) {
    return NextResponse.json({ error: 'チャレンジの生成に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ options, challengeId: challengeRecord.id })
}
