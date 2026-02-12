-- 合トレ募集に「募集期限」を追加。期限を過ぎたら募集終了扱いにする。
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz;

-- 既存行はイベント日時を募集期限として設定
UPDATE public.recruitments
SET deadline_at = event_date
WHERE deadline_at IS NULL;

-- 募集期限を過ぎたものはステータスを closed に更新（DB と表示の整合）
UPDATE public.recruitments
SET status = 'closed'
WHERE status = 'open' AND deadline_at < now();

COMMENT ON COLUMN public.recruitments.deadline_at IS '募集期限。この日時を過ぎると募集終了（closed）扱い';
