import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Supabaseのservice roleクライアント（webhookはサーバー側のみで使用）
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
      // 決済成功 → 会員をアクティブにする
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await activateByCustomerId(customerId)
        break
      }

      // サブスク開始 → 会員をアクティブにする
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await activateByCustomerId(subscription.customer as string)
        break
      }

      // サブスク更新（再開など）→ステータスに応じて更新
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status === 'active' ? 'active' : 'inactive'
        await updateStatusByCustomerId(subscription.customer as string, status)
        break
      }

      // サブスク解約 → 閲覧権限を剥奪
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await updateStatusByCustomerId(subscription.customer as string, 'inactive')
        break
      }

      // 決済失敗 → 閲覧権限を剥奪
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await updateStatusByCustomerId(invoice.customer as string, 'inactive')
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function activateByCustomerId(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const email = customer.email
  if (!email) return

  // メールアドレスでプロフィールを検索して更新
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active',
      stripe_customer_id: customerId,
    })
    .eq('email', email)

  if (error) {
    console.error('[webhook] activateByCustomerId error:', error)
  }
}

async function updateStatusByCustomerId(customerId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: status })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[webhook] updateStatusByCustomerId error:', error)
  }
}
