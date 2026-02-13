-- ============================================
-- 011: notifications の type に 'follow' を追加
-- フォローされたときにアプリ内通知＋メール送信用
-- ============================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('apply', 'approve', 'message', 'cancel', 'follow'));

COMMENT ON TABLE public.notifications IS '通知: type=apply(応募), approve(承認), message(メッセージ), cancel(中止・辞退), follow(フォロー)';
