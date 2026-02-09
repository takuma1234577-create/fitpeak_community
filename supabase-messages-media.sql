-- ============================================
-- messages に message_type 追加 / chat-media バケット用ポリシー
-- Supabase SQL Editor で実行。ストレージで「chat-media」バケットを手動作成してください。
-- リアルタイム: Dashboard > Database > Replication で messages テーブルを有効にしてください。
-- ============================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

COMMENT ON COLUMN public.messages.message_type IS 'text | image | video。image/video のとき content に Storage URL を格納';

-- chat-media バケット用ストレージポリシー（バケット作成後に実行）
DROP POLICY IF EXISTS "chat_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_select_public" ON storage.objects;

CREATE POLICY "chat_media_insert_authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "chat_media_select_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');
