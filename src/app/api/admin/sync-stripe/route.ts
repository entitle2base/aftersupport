import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
}) as Stripe

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 管理者のみ実行可能なエンドポイント
// curl -X POST https://aftersupport.vercel.app/api/admin/sync-stripe \
//   -H "x-admin-key: <ADMIN_SECRET>" で呼び出す
export async function POST(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { synced: 0, errors: [] as string[] }

  // Stripeのアクティブなサブスクリプションを全件取得
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.customer'],
    })

    for (const sub of subscriptions.data) {
      const customer = sub.customer as Stripe.Customer
      const email = customer.email
      if (!email) continue

      try {
        await supabaseAdmin.from('stripe_members').upsert({
          email,
          stripe_customer_id: customer.id,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' })

        // profilesが存在する場合も更新
        await supabaseAdmin.from('profiles')
          .update({ subscription_status: 'active', stripe_customer_id: customer.id })
          .eq('email', email)

        results.synced++
      } catch (e) {
        results.errors.push(`${email}: ${e}`)
      }
    }

    hasMore = subscriptions.has_more
    if (hasMore) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id
    }
  }

  return NextResponse.json(results)
}
