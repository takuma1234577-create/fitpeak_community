-- 008: 都道府県マップのリアルタイム反映用
-- profiles を Realtime に登録し、UPDATE で old 行を取得するために REPLICA IDENTITY FULL を設定
--
-- 注意: ALTER PUBLICATION で「already a member of publication」が出た場合は
--       Dashboard で既に追加済みなので無視してよい。REPLICA IDENTITY のみ実行されていれば可。

-- Realtime で profiles の変更を購読できるようにする
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- UPDATE イベントで変更前の prefecture/area を取得するために必要
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
