# LINE 通知が届かないときの確認リスト

## LINEでログインしているかの確認方法

### 方法1: アプリの設定画面で確認（ユーザー向け）

1. ログインした状態で **ダッシュボード → 設定 → 通知** を開く。
2. **「公式LINE連携」** のブロックを見る。
   - **「LINEでログイン済みです」**（緑）→ このアカウントは LINE 連携済み。あとは公式LINE を友だち追加すれば通知が届く。
   - **「LINEでログインしていません」** → このアカウントはメール等で登録している。LINE で通知を受け取るには、一度ログアウトして **LINEでログイン** し直す必要がある。

### 方法2: Supabase ダッシュボードで確認（管理者向け）

1. **Supabase Dashboard** → **Authentication** → **Users** を開く。
2. 対象ユーザーをクリックする。
3. **User Metadata** に **`line_user_id`** というキーがあれば、そのユーザーは LINE でログイン（または連携）済み。  
   無ければ、そのユーザーは LINE ログインしていない。

---

## 通知が届かないときの確認

メッセージを受け取っても LINE に通知が届かない場合、以下を順に確認してください。  
サーバー（Vercel のログや `npm run dev` のターミナル）に次のようなログが出ます。

---

## 1. 「Recipient has no line_user_id」が出る

**原因**: 通知を受け取るユーザーが **LINE でログインしていない**（メール登録のみのアカウント）。

- `line_user_id` は **LINE でログインしたときだけ** Supabase の `user_metadata` に保存されます。
- **対処**: 通知を受け取りたいアカウントで一度 **LINE でログイン** し直す。その後、公式LINE を友だち追加する。

---

## 2. 「LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set」が出る

**原因**: 環境変数 **LINE_MESSAGING_CHANNEL_ACCESS_TOKEN** が未設定、またはデプロイ先に反映されていない。

- ローカル: `.env.local` に設定し、サーバーを再起動。
- Vercel 等: プロジェクトの Environment Variables に追加し、再デプロイ。

**対処**: LINE Developers の **Messaging API チャネル** で Channel access token（長期）を発行し、上記の環境変数に設定する。

---

## 3. 「LINE push API error. status: 403」などが出る

**原因**: 受け取り側ユーザーが **公式LINE（Messaging API のボット）を友だち追加していない**。

- LINE のプッシュは「友だち」にしか送れません。LINE でログインしただけでは届きません。
- **対処**: 通知を受け取りたいユーザーに、**公式LINE を友だち追加** してもらう（ホームや設定の「公式LINEを友だち追加」ボタン）。

---

## 4. 「LINE push API error. status: 401」が出る

**原因**: Channel access token が無効（期限切れ・間違い・別チャネルのトークン）。

- **対処**: LINE Developers でトークンを再発行し、`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` を更新する。

---

## 5. notify-chat-message のログ自体が出ない

**原因**: メッセージ送信時に `/api/notify-chat-message` が呼ばれていない、またはクライアント側で fetch が失敗している。

- ブラウザの開発者ツールの Network タブで、メッセージ送信時に `notify-chat-message` への POST が 200 で返っているか確認する。
- 404/500 の場合は API ルートのエラーログを確認する。

---

## まとめ

| 確認項目 | 内容 |
|----------|------|
| 受け手のログイン方法 | **LINE でログイン** したアカウントか（メールのみは `line_user_id` なし） |
| 環境変数 | `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` がサーバー環境に設定されているか |
| 友だち追加 | 受け手が **公式LINE を友だち追加** しているか |
| トークン | Messaging API の Channel access token が有効か |
