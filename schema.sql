-- ============================================
-- FITPEAK コミュニティ MVP データベーススキーマ
-- Supabase / PostgreSQL
-- ============================================

-- Extensions (Supabase では通常有効)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. profiles (ユーザー情報)
-- auth.users と id で紐づく
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  bio text,
  avatar_url text,
  area text,
  gym text,
  training_years integer,
  big3_total integer,
  bench_press_max integer,
  squat_max integer,
  deadlift_max integer,
  goal text,
  instagram_id text,
  nickname text,
  gender text,
  birthday date,
  prefecture text,
  home_gym text,
  exercises text[],
  is_age_public boolean DEFAULT true,
  is_prefecture_public boolean DEFAULT true,
  is_home_gym_public boolean DEFAULT true,
  email_confirmed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 検索用インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_area ON public.profiles(area);
CREATE INDEX IF NOT EXISTS idx_profiles_goal ON public.profiles(goal);
CREATE INDEX IF NOT EXISTS idx_profiles_training_years ON public.profiles(training_years);
CREATE INDEX IF NOT EXISTS idx_profiles_big3_total ON public.profiles(big3_total);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_search_idx ON public.profiles
  USING GIN (to_tsvector('japanese', bio || ' ' || COALESCE(nickname, '') || ' ' || COALESCE(prefecture, '') || ' ' || COALESCE(home_gym, '')));

COMMENT ON TABLE public.profiles IS '筋トレガチ勢向け詳細プロフィール';
COMMENT ON COLUMN public.profiles.area IS '都道府県・活動エリア';
COMMENT ON COLUMN public.profiles.goal IS '例: 大会出場, ダイエット, バルクアップ';

-- ============================================
-- 2. recruitments (合トレ募集)
-- ============================================
CREATE TABLE IF NOT EXISTS public.recruitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_body_part text,
  event_date timestamptz NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recruitments_user_id ON public.recruitments(user_id);
CREATE INDEX IF NOT EXISTS idx_recruitments_event_date ON public.recruitments(event_date);
CREATE INDEX IF NOT EXISTS idx_recruitments_status ON public.recruitments(status);
CREATE INDEX IF NOT EXISTS idx_recruitments_target_body_part ON public.recruitments(target_body_part);

COMMENT ON COLUMN public.recruitments.target_body_part IS '部位: 胸, 背中, 脚 等';

-- ============================================
-- 3. groups (コミュニティグループ)
-- ============================================
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_private boolean DEFAULT false,
  chat_room_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);

-- ============================================
-- 4. group_members (グループ所属)
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- ============================================
-- 5. conversations (チャットルーム・1対1用)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 6. conversation_participants (チャット参加者)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- 1対1の重複防止: 同じ2人で別conversationを作らないためのユニーク制約は
-- アプリ側で「既存会話を取得」ロジックで対応するか、トリガーで制御可能

-- ============================================
-- 7. messages (メッセージ)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_read boolean DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'recruitments_updated_at') THEN
    CREATE TRIGGER recruitments_updated_at
      BEFORE UPDATE ON public.recruitments
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'groups_updated_at') THEN
    CREATE TRIGGER groups_updated_at
      BEFORE UPDATE ON public.groups
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'conversations_updated_at') THEN
    CREATE TRIGGER conversations_updated_at
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================
-- RLS (Row Level Security) 有効化
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS ポリシー: profiles
-- ============================================
-- 全員がプロフィール一覧・詳細を読める（検索用）
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- 自分のプロフィールのみ挿入（サインアップ時）
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 自分のプロフィールのみ更新
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 自分のプロフィールのみ削除（通常は auth 削除で CASCADE）
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- RLS ポリシー: recruitments
-- ============================================
CREATE POLICY "recruitments_select_all"
  ON public.recruitments FOR SELECT
  USING (true);

CREATE POLICY "recruitments_insert_own"
  ON public.recruitments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recruitments_update_own"
  ON public.recruitments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recruitments_delete_own"
  ON public.recruitments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS ポリシー: groups
-- ============================================
CREATE POLICY "groups_select_all"
  ON public.groups FOR SELECT
  USING (true);

CREATE POLICY "groups_insert_own"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_update_creator"
  ON public.groups FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_delete_creator"
  ON public.groups FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- RLS ポリシー: group_members
-- ============================================
CREATE POLICY "group_members_select_all"
  ON public.group_members FOR SELECT
  USING (true);

-- ログインユーザーは自分をメンバーとして追加可能（参加）
CREATE POLICY "group_members_insert_own"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分に関する行のみ更新（通常は不要だが許可）
CREATE POLICY "group_members_update_own"
  ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分は脱退可能。グループ作成者は他メンバーを削除可能にする場合は別ポリシー検討
CREATE POLICY "group_members_delete_own"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS ポリシー: conversations
-- ============================================
-- 参加者のみ会話を参照可能
CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- 新規会話作成は誰でも可能（参加者テーブルで制御）
CREATE POLICY "conversations_insert_any"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

-- 参加者のみ更新（通常は updated_at のみ）
CREATE POLICY "conversations_update_participant"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- 参加者のみ削除可能（運用で制限する場合はポリシー変更）
CREATE POLICY "conversations_delete_participant"
  ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS ポリシー: conversation_participants
-- ============================================
CREATE POLICY "conversation_participants_select_own"
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_insert_own"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分が参加している会話の参加者一覧は更新しない想定。必要なら追加
CREATE POLICY "conversation_participants_delete_own"
  ON public.conversation_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS ポリシー: messages
-- ============================================
-- 会話の参加者のみメッセージを読める
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_sender"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 送信者は編集・削除可能（既読フラグは受信者が更新する場合は別ポリシー検討）
CREATE POLICY "messages_update_sender"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- 受信者の is_read 更新を許可
CREATE POLICY "messages_update_receiver_read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (true);

CREATE POLICY "messages_delete_sender"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ============================================
-- サインアップ時に profiles を自動作成する関数
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users への INSERT 後に profiles を作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
