import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
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

  const { credential, challengeId } = await request.json()

  const { data: challengeRecord } = await admin
    .from('webauthn_challenges')
    .select('challenge, expires_at')
    .eq('id', challengeId)
    .eq('type', 'register')
    .single()

  if (!challengeRecord || new Date(challengeRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'チャレンジの有効期限が切れています' }, { status: 400 })
  }

  const url = new URL(request.url)
  const rpID = url.hostname
  const origin = url.origin

  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: '認証の検証に失敗しました' }, { status: 400 })
    }

    const { credential: cred, credentialDeviceType } = verification.registrationInfo

    await admin.from('webauthn_credentials').insert({
      user_id: user.id,
      credential_id: cred.id,
      public_key: Buffer.from(cred.publicKey).toString('base64url'),
      counter: cred.counter,
      device_type: credentialDeviceType,
    })

    await admin.from('webauthn_challenges').delete().eq('id', challengeId)

    return NextResponse.json({ verified: true })
  } catch {
    return NextResponse.json({ error: '検証に失敗しました' }, { status: 400 })
  }
}
