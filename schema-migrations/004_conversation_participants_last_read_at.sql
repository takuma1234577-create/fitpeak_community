-- conversation_participants に既読時刻 last_read_at を追加（LINE風既読機能用）
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

COMMENT ON COLUMN public.conversation_participants.last_read_at IS 'その会話で最後に既読にした時刻';

-- 自分のレコードのみ last_read_at を更新可能（二重実行防止）
DROP POLICY IF EXISTS "conversation_participants_update_own" ON public.conversation_participants;
CREATE POLICY "conversation_participants_update_own"
  ON public.conversation_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
