-- 016: 同一都道府県の重複公式グループを1件に整理
-- 都道府県ごとに最古の1件だけ残し、重複を削除
-- 使い方: SQL Editor に貼り付けて Run

DO $$
DECLARE
  del_count int;
  del_ids uuid[];
  conv_ids uuid[];
BEGIN
  -- 削除対象: 都道府県ごとに、最古以外のグループID
  WITH dupes AS (
    SELECT g.id, g.chat_room_id,
      row_number() OVER (PARTITION BY g.prefecture ORDER BY g.created_at, g.id) AS rn
    FROM public.groups g
    WHERE g.category = '公式' AND g.prefecture IS NOT NULL
  ),
  to_del AS (
    SELECT id, chat_room_id FROM dupes WHERE rn > 1
  )
  SELECT array_agg(id), array_agg(chat_room_id)
  INTO del_ids, conv_ids
  FROM to_del;

  IF del_ids IS NULL OR array_length(del_ids, 1) IS NULL THEN
    RAISE NOTICE '重複する公式グループはありません。';
    RETURN;
  END IF;

  DELETE FROM public.group_members WHERE group_id = ANY(del_ids);
  DELETE FROM public.conversation_participants WHERE conversation_id = ANY(COALESCE(conv_ids, ARRAY[]::uuid[]));
  DELETE FROM public.groups WHERE id = ANY(del_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;

  IF conv_ids IS NOT NULL AND array_length(conv_ids, 1) > 0 THEN
    DELETE FROM public.conversations WHERE id = ANY(conv_ids);
  END IF;

  RAISE NOTICE '% 件の重複公式グループを削除しました。各都道府県1件に整理済み。', del_count;
END $$;
