# 確認メールが届かない場合（Supabase Auth）

新規登録で「確認メールを送信しました」と表示されるが、メールが届かない場合の原因と対処です。

## 1. 迷惑メールフォルダを確認する

まず迷惑メール・ゴミ箱を確認してください。アプリでは「確認メールを再送信する」ボタンから再送信もできます。

## 2. ユーザーがサイトに反映されるタイミング

- **確認メールをクリックし、オンボーディングでプロフィール（ニックネーム等）を登録したユーザーだけ**が、検索・おすすめ・新着などの一覧に表示されます。
- 新規登録直後（ボタンを押しただけの状態）では一覧に反映されません。メール確認リンクを開き、ログイン後にオンボーディングを完了すると反映されます。

## 3. Supabase のメール送信の仕様

- **無料プラン**では、Supabase 標準のメール送信には制限があります。
- 送信先によっては届かない・遅延・スパム判定されやすいことがあります。
- **本番で確実に届けたい**場合は、**カスタム SMTP** の設定が必要です。

## 4. カスタム SMTP の設定（推奨）

Supabase ダッシュボードで、独自のメール送信サービスを使う設定ができます。

1. **Supabase Dashboard** → 対象プロジェクト → **Authentication** → **Providers** → **Email**
2. **Enable Email Confirmations** がオンになっていることを確認
3. **Custom SMTP** を有効化し、以下を設定：
   - **Sender email**: 送信元メールアドレス（例: `noreply@yourdomain.com`）
   - **Sender name**: 表示名（例: `FITPEAK`）
   - **Host / Port / User / Password**: お使いの SMTP サービス（Resend / SendGrid / AWS SES / Gmail など）の情報

例: **Resend** を使う場合  
- [Resend](https://resend.com) で API キーを発行  
- SMTP は Host: `smtp.resend.com`, Port: 465, User: `resend`, Password: 発行した API キー

## 5. メールテンプレートの確認

**Authentication** → **Email Templates** で、確認メールの文面やリンクが正しいか確認できます。  
**Confirm signup** のテンプレートで `{{ .ConfirmationURL }}` が含まれていることを確認してください。

## 6. 開発時のみメール確認を無効にする

開発中だけ「メール確認なしでログイン」にしたい場合:

- **Authentication** → **Providers** → **Email** で **Confirm email** をオフにすると、確認メールなしで登録直後にログインできます。  
本番ではセキュリティのため、確認を有効にすることを推奨します。
