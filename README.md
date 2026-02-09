# Fitpeak Community

Next.js + Supabase のフィットネスコミュニティアプリです。

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.local に Supabase の URL と anon key を設定
npm run dev
```

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL` … Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` … Supabase 匿名キー

詳細は `.env.local.example` を参照してください。

## ストレージ（アバター画像）

**方法 A（推奨）**  
`.env.local` に **SUPABASE_SERVICE_ROLE_KEY**（Project Settings > API > service_role）を追加すると、初回アップロード時に `avatars` バケットを自動作成します。その後、Supabase SQL Editor で `supabase-storage-policies.sql` を実行してアップロード用ポリシーを付与してください。

**方法 B**  
Supabase ダッシュボードの **Storage** でバケット `avatars` を手動作成（public: オン）し、同じく `supabase-storage-policies.sql` を実行してください。

## スクリプト

- `npm run dev` … 開発サーバー
- `npm run build` … 本番ビルド
- `npm run start` … 本番起動
