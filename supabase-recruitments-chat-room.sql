-- ============================================
-- recruitments に chat_room_id を追加（合トレ用チャット）
-- Supabase SQL Editor で実行
-- ============================================

ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS chat_room_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.recruitments.chat_room_id IS 'この募集用のチャットルーム（conversations.id）';
