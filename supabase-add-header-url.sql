-- プロフィールにヘッダー画像URL用カラムを追加
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS header_url text;
