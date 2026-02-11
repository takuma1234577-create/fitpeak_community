-- ============================================
-- 006: groups にヘッダー画像URL用カラムを追加
-- ============================================

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS header_url text;

COMMENT ON COLUMN public.groups.header_url IS 'グループヘッダー画像の公開URL（ストレージ等）';
