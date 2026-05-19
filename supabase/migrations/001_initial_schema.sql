-- ========================================
-- 001: 初期スキーマ
-- ========================================

-- スクール（マルチスクール対応）
create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- プロフィール（Supabase authと1:1対応）
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text,
  role                 text not null default 'student' check (role in ('student', 'admin')),
  school_id            uuid references public.schools(id),
  stripe_customer_id   text unique,
  subscription_status  text check (subscription_status in ('active', 'canceled', 'past_due', 'trialing')),
  created_at           timestamptz not null default now()
);

-- 動画
create table public.videos (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id),
  title          text not null,
  description    text,
  vimeo_id       text not null,
  category       text not null,
  tags           text[] not null default '{}',
  order_index    integer not null default 0,
  is_published   boolean not null default true,
  duration_sec   integer,
  thumbnail_url  text,
  created_at     timestamptz not null default now()
);

-- 視聴進捗（ユーザーごとの完了フラグ）
create table public.video_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  video_id         uuid not null references public.videos(id) on delete cascade,
  completed        boolean not null default false,
  watch_seconds    integer not null default 0,
  last_watched_at  timestamptz not null default now(),
  unique (user_id, video_id)
);

-- 視聴ログ（管理者分析用・累積）
create table public.video_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  video_id       uuid not null references public.videos(id) on delete cascade,
  watch_seconds  integer not null default 0,
  watched_at     timestamptz not null default now()
);

-- ========================================
-- Row Level Security
-- ========================================

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.video_progress enable row level security;
alter table public.video_logs enable row level security;

-- profiles: 本人のみ読み書き可
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- videos: サブスク有効ユーザーのみ閲覧可
create policy "videos_select_active" on public.videos
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and subscription_status = 'active'
    )
  );

-- video_progress: 本人のみ
create policy "progress_select_own" on public.video_progress
  for select using (auth.uid() = user_id);

create policy "progress_upsert_own" on public.video_progress
  for insert with check (auth.uid() = user_id);

create policy "progress_update_own" on public.video_progress
  for update using (auth.uid() = user_id);

-- video_logs: 本人のみ書き込み
create policy "logs_insert_own" on public.video_logs
  for insert with check (auth.uid() = user_id);

-- ========================================
-- 初期データ: スクール
-- ========================================

insert into public.schools (name, slug) values
  ('動画編集CHANCE', 'chance');

-- ========================================
-- Stripe Webhook用: サービスロールからのprofile更新を許可
-- ========================================

create policy "profiles_service_update" on public.profiles
  for update using (true)
  with check (true);
