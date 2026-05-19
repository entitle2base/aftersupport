import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
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
