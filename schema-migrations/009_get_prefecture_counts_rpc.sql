-- 009: 都道府県マップ用の集計 RPC（profiles の prefecture/area を集計）
-- アプリはこの結果を正規化してマップに反映する（過去ユーザー・プロフィール変更も同一導線で反映）

CREATE OR REPLACE FUNCTION public.get_prefecture_counts_raw()
RETURNS TABLE(pref text, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(p.prefecture), ''), NULLIF(TRIM(p.area), '')) AS pref,
    COUNT(*)::bigint AS cnt
  FROM profiles p
  WHERE p.email_confirmed = true
    AND (TRIM(COALESCE(p.prefecture, '')) <> '' OR TRIM(COALESCE(p.area, '')) <> '')
  GROUP BY 1;
$$;

COMMENT ON FUNCTION public.get_prefecture_counts_raw() IS '都道府県マップ用: email_confirmed な profiles の prefecture/area を生値で集計。アプリ側で正式名に正規化してマップに反映する。';
