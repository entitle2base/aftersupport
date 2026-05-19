-- ================================================================
-- Stripe決済済み会員テーブル
-- auth.usersに依存しない独立テーブル
-- Stripeのwebhookが届いたらここにupsertする
-- ユーザーが初回ログインしたときにprofilesテーブルへ昇格する
--
-- 使い方: Supabase管理画面 → SQL Editor → このファイルの内容を貼り付けて実行
-- ================================================================

CREATE TABLE IF NOT EXISTS public.stripe_members (
  email                text PRIMARY KEY,
  stripe_customer_id   text,
  subscription_status  text NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- service roleからの読み書きを許可（webhookサーバーが使う）
ALTER TABLE public.stripe_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_members_service_all" ON public.stripe_members
  FOR ALL USING (true) WITH CHECK (true);
