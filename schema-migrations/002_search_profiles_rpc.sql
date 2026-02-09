-- ============================================
-- 002: プロフィール検索 RPC
-- nickname, bio, prefecture, home_gym, exercises を対象
-- ============================================

CREATE OR REPLACE FUNCTION public.search_profiles(search_text text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.profiles
  WHERE search_text IS NULL OR trim(search_text) = ''
  OR nickname ILIKE '%' || search_text || '%'
  OR bio ILIKE '%' || search_text || '%'
  OR prefecture ILIKE '%' || search_text || '%'
  OR home_gym ILIKE '%' || search_text || '%'
  OR EXISTS (
    SELECT 1 FROM unnest(COALESCE(exercises, ARRAY[]::text[])) e
    WHERE e ILIKE '%' || search_text || '%'
  );
$$;

COMMENT ON FUNCTION public.search_profiles(text) IS 'プロフィール検索: nickname, bio, prefecture, home_gym, exercises を対象';
