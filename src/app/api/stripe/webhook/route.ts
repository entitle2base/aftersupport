import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
}) as Stripe

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await setMemberStatus(invoice.customer as string, 'active')
        break
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        await setMemberStatus(sub.customer as string, 'active')
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const status = sub.status === 'active' ? 'active' : 'inactive'
        await setMemberStatus(sub.customer as string, status)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await setMemberStatus(sub.customer as string, 'inactive')
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await setMemberStatus(invoice.customer as string, 'inactive')
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function setMemberStatus(customerId: string, status: string) {
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const email = customer.email
  if (!email) return

  // stripe_membersテーブルにupsert（ログイン前の新規会員もここで記録される）
  await supabaseAdmin
    .from('stripe_members')
    .upsert({
      email,
      stripe_customer_id: customerId,
      subscription_status: status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })

  // すでにprofilesが存在する場合は同時に更新する
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: status,
      stripe_customer_id: customerId,
    })
    .eq('email', email)
}
