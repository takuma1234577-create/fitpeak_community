-- ============================================
-- 012: プロフィール「完了」ユーザーのみサイトに表示
-- メール認証・LINEログインのみでは一覧に出さない。
-- 必須: avatar_url, nickname, bio, prefecture, exercises が揃っていること。
-- ============================================

-- 検索: プロフィール完了ユーザーのみ
CREATE OR REPLACE FUNCTION public.search_profiles(search_text text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.profiles
  WHERE email_confirmed = true
    AND nickname IS NOT NULL AND trim(nickname) <> ''
    AND avatar_url IS NOT NULL
    AND bio IS NOT NULL AND trim(bio) <> ''
    AND prefecture IS NOT NULL AND trim(prefecture) <> ''
    AND exercises IS NOT NULL AND cardinality(exercises) > 0
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

COMMENT ON FUNCTION public.search_profiles(text) IS 'プロフィール検索（プロフィール完了ユーザーのみ）: nickname, bio, prefecture, home_gym, exercises を対象';

-- ランダム取得: プロフィール完了ユーザーのみ
CREATE OR REPLACE FUNCTION public.get_random_profiles(p_exclude_ids uuid[], p_limit int)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.profiles
  WHERE email_confirmed = true
    AND nickname IS NOT NULL AND trim(nickname) <> ''
    AND avatar_url IS NOT NULL
    AND bio IS NOT NULL AND trim(bio) <> ''
    AND prefecture IS NOT NULL AND trim(prefecture) <> ''
    AND exercises IS NOT NULL AND cardinality(exercises) > 0
    AND NOT (id = ANY(COALESCE(p_exclude_ids, ARRAY[]::uuid[])))
  ORDER BY random()
  LIMIT GREATEST(0, p_limit);
$$;

COMMENT ON FUNCTION public.get_random_profiles(uuid[], int) IS 'ランダムプロフィール取得（プロフィール完了ユーザーのみ、おすすめ補填用）';
