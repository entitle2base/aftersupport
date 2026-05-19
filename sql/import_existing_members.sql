-- ================================================================
-- 既存会員の一括インポート用SQL
-- 使い方: Supabaseの「SQL Editor」にこのファイルの内容を貼り付けて実行
-- ================================================================

-- ① まずschoolのIDを確認する（実行して表示されたIDを②で使う）
SELECT id FROM public.schools WHERE slug = 'chance';

-- ================================================================
-- ② 既存会員を一括で追加する
-- 下記の 'SCHOOL_ID_HERE' を①で確認したIDに置き換えて実行
-- メールアドレスを実際の会員のものに変更すること
-- ================================================================

INSERT INTO public.profiles (id, email, subscription_status, school_id)
VALUES
  -- ↓ ここに既存会員のメールアドレスを追加していく（行を増やしてOK）
  (gen_random_uuid(), 'member1@example.com', 'active', 'SCHOOL_ID_HERE'),
  (gen_random_uuid(), 'member2@example.com', 'active', 'SCHOOL_ID_HERE'),
  (gen_random_uuid(), 'member3@example.com', 'active', 'SCHOOL_ID_HERE')
ON CONFLICT (email) DO UPDATE
  SET subscription_status = 'active';  -- すでに存在する場合はアクティブに更新

-- ================================================================
-- ③ インポート結果を確認する
-- ================================================================
SELECT email, subscription_status, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ================================================================
-- 【重要な注意点】
-- ・既存会員はこのSQLでプロフィールを先に作っておく
-- ・会員がメールアドレスでログインしようとすると、
--   マジックリンクが届き、クリックすればそのままサイトに入れる
-- ・再登録や再決済は一切不要
-- ・UUIDはPostgreSQLが自動生成するのでこちらで指定不要
-- ================================================================
