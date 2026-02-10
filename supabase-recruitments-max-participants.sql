-- recruitments に定員（max_participants）を追加
-- Supabase SQL Editor で実行（任意）

ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS max_participants integer;

COMMENT ON COLUMN public.recruitments.max_participants IS '募集定員（null=制限なし）';
