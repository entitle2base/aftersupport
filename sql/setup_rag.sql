-- ================================================================
-- RAG（カリキュラムAIチャット）用テーブルセットアップ
-- 使い方: Supabaseの「SQL Editor」にこのファイルの内容を貼り付けて実行
-- ※ カリキュラムテキストが準備できたら実行してください
-- ================================================================

-- pgvector拡張機能を有効化（ベクター検索に必要）
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================================
-- カリキュラムチャンク（テキストの断片）テーブル
-- ================================================================
CREATE TABLE IF NOT EXISTS public.curriculum_chunks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id   uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  content     text NOT NULL,              -- カリキュラムのテキスト断片
  source      text,                       -- どの動画・資料から来たか（例: '動画01_カット編集'）
  embedding   vector(1536),              -- Claude/OpenAIが生成するベクター（1536次元）
  created_at  timestamptz DEFAULT now()
);

-- ベクター検索用インデックス（高速化）
CREATE INDEX IF NOT EXISTS curriculum_chunks_embedding_idx
  ON public.curriculum_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ================================================================
-- ベクター類似検索用の関数
-- ユーザーの質問に近いカリキュラム断片を取得する
-- ================================================================
CREATE OR REPLACE FUNCTION match_curriculum_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count     int DEFAULT 5,
  p_school_id     uuid DEFAULT NULL
)
RETURNS TABLE (
  id        uuid,
  content   text,
  source    text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cc.id,
    cc.content,
    cc.source,
    1 - (cc.embedding <=> query_embedding) AS similarity
  FROM public.curriculum_chunks cc
  WHERE
    (p_school_id IS NULL OR cc.school_id = p_school_id)
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ================================================================
-- AIチャット履歴テーブル（任意・将来的に使用）
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- RLSポリシー（自分のチャット履歴だけ見える）
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のチャット履歴のみ参照可" ON public.ai_chat_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分のチャット履歴のみ挿入可" ON public.ai_chat_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- 確認クエリ
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('curriculum_chunks', 'ai_chat_logs');
