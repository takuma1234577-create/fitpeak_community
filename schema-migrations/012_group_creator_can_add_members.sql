-- 012: グループ管理者が他ユーザーをグループに招待（追加）できるようにする
-- Supabase SQL Editor で実行
CREATE POLICY "group_members_insert_creator"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
    )
  );
