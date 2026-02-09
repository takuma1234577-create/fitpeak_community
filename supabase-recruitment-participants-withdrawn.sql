-- ============================================
-- recruitment_participants に status 'withdrawn'（辞退）を追加
-- Supabase SQL Editor で実行（recruitment_participants 作成後）
-- ============================================

ALTER TABLE public.recruitment_participants
  DROP CONSTRAINT IF EXISTS recruitment_participants_status_check;

ALTER TABLE public.recruitment_participants
  ADD CONSTRAINT recruitment_participants_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));

COMMENT ON TABLE public.recruitment_participants IS '合トレ参加: pending=申請中, approved=承認済み, rejected=却下, withdrawn=辞退';
