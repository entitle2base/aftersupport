import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // サブスクリプション・LINE連携確認
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, line_user_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.subscription_status !== 'active') {
    redirect('/login?error=subscription')
  }

  // LINE未連携なら連携ページへ
  if (!profile.line_user_id) {
    redirect('/line-connect')
  }

  return <>{children}</>
}
