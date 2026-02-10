-- recruitments に専用グループ（group_id）を追加
-- 合トレ作成時にグループを自動作成し、承認時に参加させるために使用
-- Supabase SQL Editor で実行

ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.recruitments.group_id IS 'この募集の専用グループ（合トレ作成時に自動作成）';

-- グループ作成者が他ユーザーをメンバーとして追加できるようにする（承認時に参加させるため）
DROP POLICY IF EXISTS "group_members_insert_by_creator" ON public.group_members;
CREATE POLICY "group_members_insert_by_creator"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
    )
  );
