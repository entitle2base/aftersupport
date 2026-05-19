import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { default: Stripe } = await import('stripe')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
    apiVersion: '2026-04-22.dahlia',
  })
  const { priceId } = await request.json()
  const price = priceId ?? process.env.STRIPE_PRICE_ID

  if (!price) {
    return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?checkout=success`
  const cancelUrl  = `${process.env.NEXT_PUBLIC_SITE_URL}/login`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    customer_email: user?.email,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
