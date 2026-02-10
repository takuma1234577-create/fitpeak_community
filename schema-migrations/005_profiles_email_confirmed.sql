-- ============================================
-- 005: メール確認済み・プロフィール完成でサイトに反映
-- 確認メールクリック＋オンボーディング完了後のみ一覧に表示するため
-- ============================================

-- メール確認済みフラグ（確認リンククリック後にアプリ側で true に更新）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.profiles.email_confirmed IS 'メール確認済みの場合 true。確認リンク経由でログインしたタイミングでアプリが更新する。';

-- 検索・ランダム取得は「メール確認済みかつプロフィール完成（ニックネームあり）」のみ
CREATE OR REPLACE FUNCTION public.search_profiles(search_text text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.profiles
  WHERE email_confirmed = true
    AND nickname IS NOT NULL AND trim(nickname) <> ''
  AND (
    search_text IS NULL OR trim(search_text) = ''
    OR nickname ILIKE '%' || search_text || '%'
    OR bio ILIKE '%' || search_text || '%'
    OR prefecture ILIKE '%' || search_text || '%'
    OR home_gym ILIKE '%' || search_text || '%'
    OR EXISTS (
      SELECT 1 FROM unnest(COALESCE(exercises, ARRAY[]::text[])) e
      WHERE e ILIKE '%' || search_text || '%'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_random_profiles(p_exclude_ids uuid[], p_limit int)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.profiles
  WHERE email_confirmed = true
    AND nickname IS NOT NULL AND trim(nickname) <> ''
    AND NOT (id = ANY(COALESCE(p_exclude_ids, ARRAY[]::uuid[])))
  ORDER BY random()
  LIMIT GREATEST(0, p_limit);
$$;
