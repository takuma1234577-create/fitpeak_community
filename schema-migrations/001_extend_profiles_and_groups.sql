-- ============================================
-- 001: profiles / groups 拡張 + 検索インデックス
-- 既存 DB に適用するマイグレーション
-- ============================================

-- ---------------------------------------------------------------
-- [任意] 1. データの完全リセット（テスト走行用に空にする）
-- 本番では実行しないこと
-- ---------------------------------------------------------------
-- TRUNCATE TABLE messages, conversation_participants, conversations, group_members, groups, recruitments RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------
-- 2. Profiles テーブルの拡張
-- ---------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS prefecture text,
  ADD COLUMN IF NOT EXISTS home_gym text,
  ADD COLUMN IF NOT EXISTS exercises text[],
  ADD COLUMN IF NOT EXISTS is_age_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_prefecture_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_home_gym_public boolean DEFAULT true;

COMMENT ON COLUMN public.profiles.nickname IS 'ニックネーム';
COMMENT ON COLUMN public.profiles.gender IS '性別 (Male/Female/Other)';
COMMENT ON COLUMN public.profiles.birthday IS '誕生日';
COMMENT ON COLUMN public.profiles.prefecture IS '住まい（都道府県）';
COMMENT ON COLUMN public.profiles.home_gym IS 'よく行くジム';
COMMENT ON COLUMN public.profiles.exercises IS 'やってる種目 (配列)';
COMMENT ON COLUMN public.profiles.is_age_public IS '年齢公開 (true=公開, false=非公開)';
COMMENT ON COLUMN public.profiles.is_prefecture_public IS '都道府県公開';
COMMENT ON COLUMN public.profiles.is_home_gym_public IS 'ホームジム公開';

-- ---------------------------------------------------------------
-- 3. Groups テーブルの拡張
-- ---------------------------------------------------------------
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_room_id uuid;

COMMENT ON COLUMN public.groups.is_private IS 'false=オープン, true=承認制';
COMMENT ON COLUMN public.groups.chat_room_id IS 'チャットルームとの紐付け';

-- ---------------------------------------------------------------
-- 4. 検索高速化（日本語全文検索）
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_search_idx ON public.profiles
  USING GIN (to_tsvector('japanese', bio || ' ' || COALESCE(nickname, '') || ' ' || COALESCE(prefecture, '') || ' ' || COALESCE(home_gym, '')));
