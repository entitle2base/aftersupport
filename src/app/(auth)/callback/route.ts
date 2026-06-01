import { NextResponse } from 'next/server'

// すべての処理を /auth/callback に委譲する
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const params = searchParams.toString()
  return NextResponse.redirect(`${origin}/auth/callback${params ? `?${params}` : ''}`)
}
