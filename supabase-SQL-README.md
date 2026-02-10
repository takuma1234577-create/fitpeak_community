# Supabase SQL 実行ガイド

## 使うファイルは2つだけ（他は削除してよい）

| 残す | 役割 |
|------|------|
| **schema.sql** | 土台。profiles / recruitments / groups / group_members / conversations / conversation_participants / messages を作成。**必ず残す。** |
| **supabase-SQL-EDITOR-prompt.sql** | 上記のあとに実行する「追加セットアップ」一式（header_url, last_read_at, blocks, reports, **notifications**, recruitment_participants, chat_room_id, message_type/media_url, follows, プロフィール追加カラム, avatars ポリシー）。SQL Editor に貼って Run する用。 |

- **Supabase ダッシュボードの SQL**: 保存してあるクエリや履歴は削除して問題ありません。正しい定義はこのリポジトリの上記2ファイルです。
- **リポジトリの他の SQL ファイル**（`supabase-notifications.sql` / `supabase-blocks-reports.sql` / `supabase-follows-table.sql` / `supabase-recruitment-participants.sql` / `supabase-add-header-url.sql` / `supabase-add-profile-columns.sql` / `schema-migrations/004_*.sql` / `supabase-messages-media.sql` / `supabase-storage-policies.sql` / `supabase-consolidated-setup.sql` など）は、**supabase-SQL-EDITOR-prompt.sql に統合済み**なので、削除してかまいません。履歴用に残したい場合はフォルダをまとめて `sql-archive/` などに退避してもよいです。

**注意:** 「この1本（supabase-SQL-EDITOR-prompt.sql）だけ」にすると、**profiles や conversations が存在しない**ためエラーになります。**必ず先に schema.sql を実行し、そのあと supabase-SQL-EDITOR-prompt.sql を実行**してください。

---

## クラッシュとSQLの関係

**あり得ます。** 次のような流れでクラッシュの原因になり得ます。

1. **マイグレーションの二重実行**  
   同じ SQL を2回実行すると `CREATE POLICY "xxx" already exists` などで失敗する。
2. **DB が不整合な状態になる**  
   途中で失敗すると、テーブルはあるがポリシーが無い・足りないなどになり、アプリのクエリが権限エラーや想定外のエラーを返す。
3. **アプリ側で未処理の例外**  
   そのエラーを catch していないと、合トレ募集や他ユーザープロフィールなどでクラッシュしていた（※ アプリ側は try/catch で対策済み）。

## 対策済み

- **冪等化**  
  以下のファイルでは、ポリシー作成の直前に `DROP POLICY IF EXISTS "ポリシー名" ON テーブル` を追加済みです。**同じファイルを2回実行してもエラーになりません。**

  - `schema-migrations/004_conversation_participants_last_read_at.sql`
  - `supabase-notifications.sql`
  - `supabase-blocks-reports.sql`
  - `supabase-follows-table.sql`
  - `supabase-recruitment-participants.sql`

- テーブル・インデックスはもともと `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` のため、二重実行で失敗しません。

## ブロックリスト・通報

- **ブロックリストのみ** … `supabase-blocks-list.sql`（blocks テーブル＋RLS）
- **ブロック＋通報** … `supabase-blocks-reports.sql`（blocks と reports をまとめて作成）

どちらか一方を実行すればブロック機能は使えます。通報機能も使う場合は `supabase-blocks-reports.sql` を実行してください。

## 推奨実行順（新規セットアップ時）

1. `schema.sql`（土台）
2. `schema-migrations/001_extend_profiles_and_groups.sql`
3. `schema-migrations/002_search_profiles_rpc.sql`
4. `schema-migrations/003_get_random_profiles_rpc.sql`
5. `schema-migrations/004_conversation_participants_last_read_at.sql`
6. `supabase-add-profile-columns.sql`（必要な場合）
7. `supabase-follows-table.sql`
8. `supabase-notifications.sql`
9. `supabase-blocks-reports.sql`（またはブロックのみなら `supabase-blocks-list.sql`）
10. `supabase-recruitment-participants.sql`（および `supabase-recruitment-participants-withdrawn.sql` など関連）
11. その他 `supabase-*.sql`（storage / messages など）

既に本番で動いている DB には、**変更したマイグレーション（004 や notifications など）を「もう一度」実行しても、今回の修正で安全に通るようになっています。**

---

## 統合セットアップ（1〜10 を一括実行）

**`supabase-consolidated-setup.sql`** に、依頼いただいた 1〜10 の内容を**実行順で・冪等**にまとめてあります。

- **SQL Editor にそのまま貼りたいとき**は **`supabase-SQL-EDITOR-prompt.sql`** を使うと便利です。先頭に「やり方・前提・実行後」の説明コメントが入っており、ファイルごとコピーして SQL Editor に貼り付けて Run するだけで実行できます。

- プロジェクトのアプリに合わせた定義にしてあります（例: `reports.target_id` は text、`recruitment_participants` は複合 PK、`profiles` は `facebook_url` / `header_url`）。
- ポリシーはすべて `DROP POLICY IF EXISTS` のあと `CREATE POLICY` なので、**同じファイルを2回実行してもエラーになりません。**
- 前提: **`schema.sql` で conversations / conversation_participants / messages 等が既に作成されていること。** 新規プロジェクトでは先に `schema.sql` を実行してから、このファイルを実行してください。

全テーブルを消して最初から作り直す場合（テスト用のみ）は **`supabase-RESET-FULL.sql`** を参照してください。本番では実行しないでください。

---

## Supabase ダッシュボードで確認・変更すること

SQL を流したあと、**Supabase の画面上でも次の設定を確認**すると安心です。

### 1. SQL の反映（必須）

- **SQL Editor** で `schema.sql` → `supabase-consolidated-setup.sql`（または個別マイグレ）を実行していること。
- エラーが出た場合は、該当オブジェクトが既に存在していないか確認（冪等化済みなので、多くの場合は再実行で通ります）。

### 2. Realtime（チャットでリアルタイム表示する場合）

- **Database** → **Replication** を開く。
- **supabase_realtime** に次のテーブルが含まれているか確認し、無ければ追加する：
  - **messages**（チャットメッセージの即時表示）
  - **conversation_participants**（既読のリアルタイム更新）
- 通知をリアルタイムで受け取りたい場合は **notifications** も追加してよい（アプリは現状ポーリングでも動作します）。

### 3. Storage（画像アップロード）

- **Storage** に次のバケットがあるか確認：
  - **avatars**（プロフィール・ヘッダー画像）
  - **chat-media**（チャットの画像・動画）
- バケットは SQL の `INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING` でも作成されます。手動で作った場合は **Public bucket** のオン/オフを用途に合わせて設定。
- ポリシーは `supabase-consolidated-setup.sql` または `supabase-storage-policies.sql` で設定済み。ダッシュボードの **Policies** で名前が一致しているかだけ確認するとよいです。

### 4. Authentication（認証）

- **Authentication** → **URL Configuration** で、アプリの **Redirect URLs** に本番・開発の URL を追加（例: `https://your-app.com/**`, `http://localhost:3000/**`）。
- メール認証や OAuth を使う場合は、**Providers** の設定も確認。

### 5. その他

- **Project Settings** → **API** の Project URL と anon key は、`.env.local` の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` と一致しているか確認。
- RLS は SQL で有効化しているので、**Database** → **Tables** → 各テーブルで **RLS enabled** がオンになっていれば問題ありません。

**まとめ:** SQL でスキーマとポリシーを揃えたうえで、**Realtime の対象テーブル** と **Storage のバケット・認証のリダイレクトURL** をダッシュボードで確認・変更すると、クラッシュや権限まわりが安定しやすくなります。
