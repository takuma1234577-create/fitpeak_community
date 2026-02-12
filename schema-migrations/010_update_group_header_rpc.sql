-- ============================================
-- 010: グループヘッダー画像URLを更新する RPC（作成者のみ）
-- RLS で 0 件になる場合があるため、SECURITY DEFINER で作成者チェックしてから更新
-- 使い方: Supabase ダッシュボード → SQL Editor → このファイルを実行
-- ============================================

CREATE OR REPLACE FUNCTION public.update_group_header_url(
  p_group_id uuid,
  p_header_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_by uuid;
BEGIN
  SELECT created_by INTO v_created_by
  FROM public.groups
  WHERE id = p_group_id;

  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'グループが見つかりません';
  END IF;

  IF auth.uid() IS DISTINCT FROM v_created_by THEN
    RAISE EXCEPTION 'このグループのヘッダー画像を変更する権限がありません';
  END IF;

  UPDATE public.groups
  SET header_url = p_header_url,
      updated_at = now()
  WHERE id = p_group_id;

  RETURN p_group_id;
END;
$$;

COMMENT ON FUNCTION public.update_group_header_url(uuid, text) IS
  'グループのヘッダー画像URLを更新する。作成者のみ実行可能。';

GRANT EXECUTE ON FUNCTION public.update_group_header_url(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_group_header_url(uuid, text) TO service_role;
