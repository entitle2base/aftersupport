-- サムネイル添削の利用ログテーブル
-- 1日の利用上限チェックに使用する

CREATE TABLE IF NOT EXISTS public.thumbnail_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.thumbnail_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thumbnail_logs_service_all" ON public.thumbnail_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX thumbnail_logs_user_date_idx ON public.thumbnail_logs (user_id, created_at);
