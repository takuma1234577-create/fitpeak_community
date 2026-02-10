-- groups に chat_room_id（と is_private）を追加
-- Supabase SQL Editor で実行（「Could not find the chat_room_id column」が出る場合）

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS chat_room_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

COMMENT ON COLUMN public.groups.chat_room_id IS 'グループ用チャットルーム（conversations.id）';
COMMENT ON COLUMN public.groups.is_private IS 'false=オープン, true=承認制';
