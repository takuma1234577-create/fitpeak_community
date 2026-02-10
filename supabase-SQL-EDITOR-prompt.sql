-- =============================================================================
-- 【Supabase SQL Editor に貼り付けて実行する用】
-- =============================================================================
--
-- やり方:
--   1. Supabase ダッシュボード → SQL Editor を開く
--   2. このファイルの中身をすべてコピーする（このコメントから末尾まで）
--   3. エディタに貼り付けて「Run」を押す
--
-- 前提:
--   - 先に schema.sql で profiles / recruitments / groups / group_members /
--     conversations / conversation_participants / messages が作成済みであること。
--     新規プロジェクトの場合は、先に schema.sql を実行してからこのスクリプトを実行してください。
--
-- 特徴:
--   - 冪等です。同じスクリプトを2回実行してもエラーにならないようにしてあります。
--   - 1〜10 + notifications（header_url, last_read_at, blocks, reports,
--     notifications, recruitment_participants, chat_room_id, message_type/media_url,
--     follows, profiles 追加カラム, avatars ストレージポリシー）を一括で反映します。
--
-- 実行後:
--   - Database → Replication で messages / conversation_participants を
--     supabase_realtime に追加すると、チャットのリアルタイムが動きます。
--
-- =============================================================================

-- ---------------------------------------------------------------
-- １. プロフィールに header_url カラムを追加
-- ---------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS header_url text;

-- ---------------------------------------------------------------
-- ２. 参加者テーブルに「最後に読んだ時間」を追加 + 既読更新ポリシー
-- ---------------------------------------------------------------
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.conversation_participants.last_read_at IS 'その会話で最後に既読にした時刻';

DROP POLICY IF EXISTS "conversation_participants_update_own" ON public.conversation_participants;
CREATE POLICY "conversation_participants_update_own"
  ON public.conversation_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- ３. ブロック機能 (blocks) と 通報機能 (reports)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
DROP POLICY IF EXISTS "blocks_insert_own" ON public.blocks;
DROP POLICY IF EXISTS "blocks_delete_own" ON public.blocks;

CREATE POLICY "blocks_select_own" ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "blocks_insert_own" ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete_own" ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('user', 'recruitment', 'group')),
  reason text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON public.reports(target_id, type);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;

CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- ---------------------------------------------------------------
-- ３のつづき. 通知 (notifications)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('apply', 'approve', 'message', 'cancel')),
  content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_as_sender" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own_as_recipient" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_as_sender" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "notifications_insert_own_as_recipient" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- ４. 合トレ募集にチャットルームID + 参加者テーブル
-- ---------------------------------------------------------------
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS chat_room_id uuid REFERENCES public.conversations(id);

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

DROP POLICY IF EXISTS "recruitment_participants_select_all" ON public.recruitment_participants;
DROP POLICY IF EXISTS "recruitment_participants_insert_own" ON public.recruitment_participants;
DROP POLICY IF EXISTS "recruitment_participants_update_creator" ON public.recruitment_participants;
DROP POLICY IF EXISTS "recruitment_participants_delete_own" ON public.recruitment_participants;
DROP POLICY IF EXISTS "recruitment_participants_delete_creator" ON public.recruitment_participants;

CREATE POLICY "recruitment_participants_select_all" ON public.recruitment_participants FOR SELECT USING (true);
CREATE POLICY "recruitment_participants_insert_own" ON public.recruitment_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recruitment_participants_update_creator" ON public.recruitment_participants FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.recruitments r WHERE r.id = recruitment_participants.recruitment_id AND r.user_id = auth.uid()))
  WITH CHECK (true);
CREATE POLICY "recruitment_participants_delete_own" ON public.recruitment_participants FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "recruitment_participants_delete_creator" ON public.recruitment_participants FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.recruitments r WHERE r.id = recruitment_participants.recruitment_id AND r.user_id = auth.uid()));

DROP POLICY IF EXISTS "conversation_participants_insert_recruitment_creator" ON public.conversation_participants;
CREATE POLICY "conversation_participants_insert_recruitment_creator" ON public.conversation_participants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.recruitments r WHERE r.chat_room_id = conversation_participants.conversation_id AND r.user_id = auth.uid()));

-- ---------------------------------------------------------------
-- ５. メッセージにタイプ・メディアURL + chat-media バケット
-- ---------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_select_public" ON storage.objects;

CREATE POLICY "chat_media_insert_authenticated" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media');
CREATE POLICY "chat_media_select_public" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chat-media');

-- ---------------------------------------------------------------
-- ７. Facebook 用カラム + follows テーブル + avatars バケット
-- ---------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS facebook_url text;

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_any" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;

CREATE POLICY "follows_select_any" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---------------------------------------------------------------
-- ８・９. プロフィールに不足しているカラムを追加
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prefecture text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_gym text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exercises text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_age_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_prefecture_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_home_gym_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_url text;

-- ---------------------------------------------------------------
-- １０. ストレージ avatars バケット用 RLS ポリシー
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.jwt()->>'sub'));

CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.jwt()->>'sub'))
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.jwt()->>'sub'));

CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.jwt()->>'sub'));

-- =============================================================================
-- 以上で 1〜10 のセットアップが完了です。
-- =============================================================================
