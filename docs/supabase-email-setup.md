# 確認メールが届かない場合（Supabase Auth）

新規登録で「確認メールを送信しました」と表示されるが、メールが届かない場合の原因と対処です。

## 「Error sending confirmation email」が出る場合

新規登録時にこのエラーが出る主な原因と対処です。

1. **カスタム SMTP が未設定**
   - 無料プランでは Supabase 標準のメール送信に制限があり、送信に失敗することがあります。
   - **対処**: 下記「カスタム SMTP の設定」で Gmail / Resend / SendGrid などの SMTP を設定してください。

2. **カスタム SMTP の設定ミス**
   - Host・Port・ユーザー名・パスワードが誤っていると送信できません。
   - **対処**: 利用中のメールサービス／SMTP の公式ドキュメントで正しい値を確認し、Supabase の **Authentication** → **Email** で再設定してください。

3. **開発中だけメール確認を無効にする**
   - 確認メールを送らずに登録だけ試したい場合は、**Authentication** → **Providers** → **Email** で **Confirm email** をオフにすると、登録直後にログインできます（本番ではオンにすることを推奨）。

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

例: **Gmail** を使う場合  
- Host: `smtp.gmail.com`, Port: 465, User: 送信に使う Gmail アドレス  
- **パスワードには「アプリパスワード」を必ず使用**（通常のログインパスワードでは送信できません）  
  - Google アカウントで 2 段階認証を有効にしたうえで、[アプリパスワード](https://myaccount.google.com/apppasswords)で発行した 16 文字のパスワードを設定する  
- 画面上の「個人用メール用」という警告は、Gmail が個人向けである旨の注意です。アプリパスワードを正しく設定すれば送信できることが多いです。

例: **Resend** を使う場合  
- [Resend](https://resend.com) で API キーを発行  
- SMTP は Host: `smtp.resend.com`, Port: 465, User: `resend`, Password: 発行した API キー

## 5. メールテンプレートの確認・日本語化

**Authentication** → **Email Templates** で、確認メールの文面やリンクを変更できます。  
**Confirm signup** のテンプレートには必ず `{{ .ConfirmationURL }}` を入れてください。

### メールを日本語にする

Supabase Dashboard → **Authentication** → **Email Templates** を開き、各テンプレートの **Subject（件名）** と **Body（本文）** を以下に差し替えると日本語になります。

**Confirm signup（新規登録の確認）**

- **Subject（件名）**
  ```
  【FITPEAK】メールアドレスの確認
  ```
- **Body（本文）**
  ```
  こんにちは。

  FITPEAK へのご登録ありがとうございます。
  以下のリンクをクリックして、メールアドレスを確認してください。

  {{ .ConfirmationURL }}

  このメールに心当たりがない場合は、何も行わずに破棄してください。

  — FITPEAK
  ```

**Magic Link（マジックリンクでログイン）**

- **Subject（件名）**
  ```
  【FITPEAK】ログイン用リンク
  ```
- **Body（本文）**
  ```
  こんにちは。

  以下のリンクをクリックしてログインしてください。

  {{ .ConfirmationURL }}

  このメールに心当たりがない場合は、何も行わずに破棄してください。

  — FITPEAK
  ```

**Reset password（パスワード再設定）**

- **Subject（件名）**
  ```
  【FITPEAK】パスワードの再設定
  ```
- **Body（本文）**
  ```
  こんにちは。

  パスワード再設定のリクエストを受け付けました。
  以下のリンクをクリックして、新しいパスワードを設定してください。

  {{ .ConfirmationURL }}

  リクエストしていない場合は、何も行わずに破棄してください。

  — FITPEAK
  ```

各テンプレートで **Save** を押すと反映されます。

## 6. 確認メールのリンクで「localhost refused to connect」になる場合

メール内のリンクをクリックしたあと、Supabase が **Site URL** に設定したアドレスへリダイレクトします。ここが `http://localhost:3000` のままだと、次のようなときに「This site can't be reached」「ERR_CONNECTION_REFUSED」になります。

- 開発サーバー（`npm run dev`）を起動していない
- メールをスマホなど別デバイスで開いている（そのデバイスには localhost のアプリがない）

**対処法**

1. **同じパソコンで開発中に確認する**
   - ターミナルで `npm run dev` を実行し、アプリを起動した状態にする
   - **同じパソコン**のブラウザでメールのリンクを開く → 認証後に localhost で開ける

2. **本番・ステージングの URL を使う（推奨）**
   - Supabase Dashboard → **Authentication** → **URL Configuration** を開く
   - **Site URL** を、実際に使うアプリの URL に変更する  
     例: `https://your-app.vercel.app` や `https://fitpeak.example.com`
   - **Redirect URLs** に、認証後に飛んでよい URL を追加する  
     例: `https://your-app.vercel.app/**`  
     ローカルも使う場合は `http://localhost:3000/**` も追加する
   - 保存後、**再度「確認メールを再送信」** から新しいメールを送ると、リンクが新しい Site URL を使うようになります

3. **リンクの有効期限**
   - 確認リンクは一定時間で無効になります。エラーで開けなかった場合は、ログイン画面の「確認メールを再送信」で新しいメールを送り、そのリンクを開き直してください。

## 7. 開発時のみメール確認を無効にする

開発中だけ「メール確認なしでログイン」にしたい場合:

- **Authentication** → **Providers** → **Email** で **Confirm email** をオフにすると、確認メールなしで登録直後にログインできます。  
本番ではセキュリティのため、確認を有効にすることを推奨します。
