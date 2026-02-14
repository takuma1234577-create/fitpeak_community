-- 013: groups に prefecture を追加（公式都道府県グループ用）
-- 使い方: Supabase ダッシュボード → SQL Editor → このファイルの中身を貼り付けて Run

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS prefecture text;

COMMENT ON COLUMN public.groups.prefecture IS '都道府県（公式グループの場合に設定。例: 北海道, 東京都）';

CREATE INDEX IF NOT EXISTS idx_groups_prefecture ON public.groups(prefecture) WHERE prefecture IS NOT NULL;
