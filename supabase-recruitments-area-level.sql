-- ============================================
-- recruitments に エリア(area) と レベル(level) を追加
-- Supabase SQL Editor で実行
-- ============================================

ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS level text;

COMMENT ON COLUMN public.recruitments.area IS '募集エリア（都道府県など）';
COMMENT ON COLUMN public.recruitments.level IS '対象レベル: beginner, intermediate, advanced, competitor';
