-- 019: profiles に training_level を追加（初心者/中級者/上級者）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_level text;

COMMENT ON COLUMN public.profiles.training_level IS 'トレーニングレベル: beginner, intermediate, advanced';
