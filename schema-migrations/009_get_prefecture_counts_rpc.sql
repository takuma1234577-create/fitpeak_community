-- 009: 都道府県マップ用の集計 RPC（profiles の prefecture/area を集計）
-- 使い方: Supabase ダッシュボード → SQL Editor → このファイルの中身をすべて貼り付けて Run
-- アプリはこの結果を正規化してマップに反映する（過去ユーザー・プロフィール変更も同一導線で反映）
-- email_confirmed カラムがある場合はメール確認済みのみ集計、ない場合は prefecture/area がある全件を集計

CREATE OR REPLACE FUNCTION public.get_prefecture_counts_raw()
RETURNS TABLE(pref text, cnt bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_confirmed'
  ) THEN
    RETURN QUERY
    SELECT
      COALESCE(NULLIF(TRIM(p.prefecture), ''), NULLIF(TRIM(p.area), '')) AS pref,
      COUNT(*)::bigint AS cnt
    FROM profiles p
    WHERE p.email_confirmed = true
      AND (TRIM(COALESCE(p.prefecture, '')) <> '' OR TRIM(COALESCE(p.area, '')) <> '')
    GROUP BY 1;
  ELSE
    RETURN QUERY
    SELECT
      COALESCE(NULLIF(TRIM(p.prefecture), ''), NULLIF(TRIM(p.area), '')) AS pref,
      COUNT(*)::bigint AS cnt
    FROM profiles p
    WHERE (TRIM(COALESCE(p.prefecture, '')) <> '' OR TRIM(COALESCE(p.area, '')) <> '')
    GROUP BY 1;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_prefecture_counts_raw() IS '都道府県マップ用: profiles の prefecture/area を生値で集計（email_confirmed があればその条件付き）。アプリ側で正式名に正規化してマップに反映する。';

-- 都道府県マップのモーダル用: 集計と同じ条件で該当ユーザー一覧を返す（人数と一覧の一致を保証）
-- id, nickname, username, bio, avatar_url, prefecture, created_at のみ返す（home_gym/exercises はカラム未追加のDBでも動くように省略）
-- 戻り型を変更する場合は既存関数を削除する必要がある
DROP FUNCTION IF EXISTS public.get_prefecture_users(text[]);
CREATE OR REPLACE FUNCTION public.get_prefecture_users(match_values text[])
RETURNS TABLE(
  id uuid,
  nickname text,
  username text,
  bio text,
  avatar_url text,
  prefecture text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_confirmed'
  ) THEN
    RETURN QUERY
    SELECT
      p.id,
      p.nickname,
      p.username,
      p.bio,
      p.avatar_url,
      p.prefecture,
      p.created_at
    FROM profiles p
    WHERE p.email_confirmed = true
      AND (
        TRIM(COALESCE(p.prefecture, '')) = ANY(match_values)
        OR TRIM(COALESCE(p.area, '')) = ANY(match_values)
      )
    ORDER BY p.created_at DESC
    LIMIT 50;
  ELSE
    RETURN QUERY
    SELECT
      p.id,
      p.nickname,
      p.username,
      p.bio,
      p.avatar_url,
      p.prefecture,
      p.created_at
    FROM profiles p
    WHERE (
      TRIM(COALESCE(p.prefecture, '')) = ANY(match_values)
      OR TRIM(COALESCE(p.area, '')) = ANY(match_values)
    )
    ORDER BY p.created_at DESC
    LIMIT 50;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_prefecture_users(text[]) IS '都道府県マップのモーダル用: get_prefecture_counts_raw と同じ条件で該当ユーザー一覧を返す。';

-- クライアント（anon / authenticated）から RPC を呼べるようにする（エラーは無視＝既に付与済みのとき）
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.get_prefecture_counts_raw() TO anon;
  GRANT EXECUTE ON FUNCTION public.get_prefecture_counts_raw() TO authenticated;
  GRANT EXECUTE ON FUNCTION public.get_prefecture_users(text[]) TO anon;
  GRANT EXECUTE ON FUNCTION public.get_prefecture_users(text[]) TO authenticated;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
