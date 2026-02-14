-- 017: 先着100人記念バッジ用カラム
-- 使い方: SQL Editor に貼り付けて Run

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS early_adopter boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.profiles.early_adopter IS '先着100人登録記念バッジ。true のときプロフィールに記念バッジを表示';

-- 登録順（created_at, id）で先着100人にバッジを付与
UPDATE public.profiles
SET early_adopter = true
WHERE id IN (
  SELECT id FROM public.profiles
  ORDER BY created_at ASC, id ASC
  LIMIT 100
);
