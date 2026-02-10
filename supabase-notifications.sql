-- ============================================
-- notifications（通知）
-- Supabase SQL Editor で実行
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('apply', 'approve', 'message', 'cancel')),
  content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 二重実行防止: 既存ポリシーを削除してから作成
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_as_sender" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own_as_recipient" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- 自分宛ての通知のみ読める
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 通知の送り手（sender_id = auth.uid()）が insert 可能（応募・承認・メッセージ・中止のトリガー用）
CREATE POLICY "notifications_insert_as_sender"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- システム的な通知（sender_id が null の場合は募集者本人が insert する想定）
-- 自分宛ての通知なら insert 許可（募集中止時に参加者へ通知するのは「募集者」が insert、sender_id は募集者）
CREATE POLICY "notifications_insert_own_as_recipient"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 受け取り主のみ既読更新可能
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 受け取り主のみ削除可能（任意）
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.notifications IS '通知: type=apply(応募), approve(承認), message(メッセージ), cancel(中止・辞退)';

-- リアルタイム: Dashboard > Database > Replication で notifications を supabase_realtime に追加するか、以下を一度だけ実行
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
