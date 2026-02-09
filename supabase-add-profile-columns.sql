-- ============================================
-- profiles に不足しているカラムをまとめて追加する
-- エラー「Could not find the '〇〇' column」が出た場合、Supabase SQL Editor で実行
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prefecture text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_gym text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exercises text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_age_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_prefecture_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_home_gym_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
