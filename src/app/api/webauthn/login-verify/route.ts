import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { credential, challengeId } = await request.json()
  const admin = createAdminClient()

  const { data: challengeRecord } = await admin
    .from('webauthn_challenges')
    .select('challenge, expires_at')
    .eq('id', challengeId)
    .eq('type', 'authenticate')
    .single()

  if (!challengeRecord || new Date(challengeRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'チャレンジの有効期限が切れています' }, { status: 400 })
  }

  const { data: credRecord } = await admin
    .from('webauthn_credentials')
    .select('user_id, credential_id, public_key, counter')
    .eq('credential_id', credential.id)
    .single()

  if (!credRecord) {
    return NextResponse.json({ error: 'このデバイスは登録されていません' }, { status: 404 })
  }

  const url = new URL(request.url)
  const rpID = url.hostname
  const origin = url.origin

  try {
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credRecord.credential_id,
        publicKey: new Uint8Array(Buffer.from(credRecord.public_key, 'base64url')),
        counter: credRecord.counter,
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 400 })
    }

    await admin
      .from('webauthn_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('credential_id', credRecord.credential_id)

    await admin.from('webauthn_challenges').delete().eq('id', challengeId)

    const { data: { user }, error: userError } = await admin.auth.admin.getUserById(credRecord.user_id)
    if (userError || !user?.email) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (linkError || !linkData.properties?.hashed_token) {
      return NextResponse.json({ error: 'セッションの作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      verified: true,
      token: linkData.properties.hashed_token,
      email: user.email,
    })
  } catch {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 400 })
  }
}
