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

プロフィール写真を有効にする場合、Supabase ダッシュボードで **Storage** にバケット `avatars` を作成し、認証済みユーザーがアップロード・読み取りできるポリシーを設定してください。

## スクリプト

- `npm run dev` … 開発サーバー
- `npm run build` … 本番ビルド
- `npm run start` … 本番起動
