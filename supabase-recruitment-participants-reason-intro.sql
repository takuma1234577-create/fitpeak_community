-- recruitment_participants に参加理由・自己紹介を追加
-- Supabase SQL Editor で実行

ALTER TABLE public.recruitment_participants
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS self_intro text;

COMMENT ON COLUMN public.recruitment_participants.reason IS '参加理由（申請時に入力）';
COMMENT ON COLUMN public.recruitment_participants.self_intro IS '簡単な自己紹介（申請時に入力）';
