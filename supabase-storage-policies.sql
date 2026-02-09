-- ============================================
-- ストレージ「avatars」バケット用 RLS ポリシー
-- バケット作成後、Supabase SQL Editor で実行してください。
-- 既に同じ名前のポリシーがある場合は先に DROP してから実行してください。
-- ============================================

-- 既存ポリシーを削除（エラーになる場合はスキップしてよい）
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

-- 認証済みユーザーが自分のフォルダ（user_id/）にのみアップロード可能
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- 公開読み取り
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 認証済みユーザーが自分のファイルを更新・削除可能
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);
