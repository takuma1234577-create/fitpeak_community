-- ============================================
-- recruitment_participants（合トレ参加申請・承認）
-- Supabase SQL Editor で実行
-- ============================================

CREATE TABLE IF NOT EXISTS public.recruitment_participants (
  recruitment_id uuid NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (recruitment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recruitment_participants_user_id ON public.recruitment_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_participants_status ON public.recruitment_participants(status);

ALTER TABLE public.recruitment_participants ENABLE ROW LEVEL SECURITY;

-- 誰でも参加者一覧を読める（募集詳細・管理用）
CREATE POLICY "recruitment_participants_select_all"
  ON public.recruitment_participants FOR SELECT
  USING (true);

-- 認証ユーザーが自分で申請（INSERT）できる
CREATE POLICY "recruitment_participants_insert_own"
  ON public.recruitment_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 募集作成者のみ UPDATE（承認・却下）
CREATE POLICY "recruitment_participants_update_creator"
  ON public.recruitment_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.id = recruitment_participants.recruitment_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (true);

-- 自分は自分の申請を削除可能、作成者は誰の参加も削除可能
CREATE POLICY "recruitment_participants_delete_own"
  ON public.recruitment_participants FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "recruitment_participants_delete_creator"
  ON public.recruitment_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.id = recruitment_participants.recruitment_id AND r.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.recruitment_participants IS '合トレ参加申請: pending=申請中, approved=承認済み, rejected=却下';

-- 承認時に募集作成者が conversation_participants へ追加するためのポリシー
CREATE POLICY "conversation_participants_insert_recruitment_creator"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.chat_room_id = conversation_participants.conversation_id
        AND r.user_id = auth.uid()
    )
  );
