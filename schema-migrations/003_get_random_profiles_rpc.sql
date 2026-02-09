-- ============================================
-- 003: ランダムプロフィール取得 RPC（おすすめユーザー補填用）
-- ============================================

CREATE OR REPLACE FUNCTION public.get_random_profiles(p_exclude_ids uuid[], p_limit int)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.profiles
  WHERE NOT (id = ANY(COALESCE(p_exclude_ids, ARRAY[]::uuid[])))
  ORDER BY random()
  LIMIT GREATEST(0, p_limit);
$$;

COMMENT ON FUNCTION public.get_random_profiles(uuid[], int) IS '除外ID以外のプロフィールをランダムに取得（おすすめユーザー補填用）';
