# アーキテクチャ概要

## スタック
- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **認証**: Supabase Auth（マジックリンク）
- **DB**: Supabase (PostgreSQL)
- **決済**: Stripe
- **動画**: Vimeo Pro（ドメイン制限）
- **AI**: Anthropic Claude API
- **ホスティング**: Vercel

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/         # ログイン画面（マジックリンク送信）
│   │   └── callback/      # Supabase OAuthコールバック
│   ├── (protected)/       # ← サブスク有効ユーザーのみアクセス可
│   │   ├── portal/        # ポータル画面
│   │   ├── dashboard/     # 学習ダッシュボード
│   │   ├── videos/        # 動画一覧・詳細
│   │   └── ai-chat/       # AIチャット
│   ├── api/
│   │   ├── auth/          # 認証関連API
│   │   ├── stripe/
│   │   │   ├── checkout/  # Stripeチェックアウトセッション作成
│   │   │   └── webhook/   # Stripe Webhook受信
│   │   ├── ai/            # Claude API呼び出し（APIキー隠蔽）
│   │   ├── progress/      # 視聴進捗の保存
│   │   └── video-log/     # 視聴ログの記録
│   ├── layout.tsx
│   └── page.tsx           # / → ログイン状態に応じてリダイレクト
├── components/
│   ├── ui/                # 汎用UIパーツ（Button, Input等）
│   ├── layout/            # ヘッダー、ナビ等
│   ├── video/             # 動画プレイヤー、カード
│   ├── ai/                # AIチャットUI
│   ├── progress/          # 進捗バー等
│   └── auth/              # ログアウトボタン等
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # ブラウザ用クライアント
│   │   ├── server.ts      # サーバー用クライアント
│   │   └── middleware.ts  # セッション更新
│   ├── stripe/
│   │   └── client.ts      # Stripeクライアント
│   └── ai/                # AIプロンプト定義
├── hooks/                 # カスタムフック（useProgress等）
├── types/
│   └── index.ts           # 全型定義
└── middleware.ts           # 認証ガード

supabase/
└── migrations/
    └── 001_initial_schema.sql  # DB初期スキーマ

docs/
└── architecture.md         # この文書
```

## データフロー

### ログイン
1. `/login` でメアド入力
2. Supabaseがマジックリンクをメール送信
3. `/auth/callback` でセッション確立
4. `profiles.subscription_status = 'active'` なら `/portal` へ

### Stripe決済 → アクセス付与
1. Stripeチェックアウト完了
2. `payment_intent.succeeded` Webhookを `/api/stripe/webhook` が受信
3. `profiles.subscription_status` を `active` に更新
4. ユーザーがマジックリンクでログイン → そのままアクセス可能

## セキュリティ
- Row Level Security (RLS) で全テーブルをユーザー単位に保護
- Claude APIキーはサーバーサイドのみ（クライアントには非公開）
- Stripe Webhook署名検証を必ず実施
- Vimeoはドメイン制限でサイト外での再生をブロック
