-- ============================================
-- 【警告】全テーブルを削除して作り直すスクリプト
-- ============================================
-- ・本番環境では絶対に実行しないでください。
-- ・実行すると messages / conversations / profiles 等のデータがすべて消えます。
-- ・通常のセットアップでは supabase-consolidated-setup.sql を使用してください。
-- ============================================

-- リセット用（既存があれば削除して作り直す）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.recruitments CASCADE;
DROP TABLE IF EXISTS public.recruitment_participants CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.blocks CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- --- 1. Profiles テーブル（最小構成；本番では schema.sql + マイグレで復元すること） ---
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
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
  achievements jsonb DEFAULT '[]'::jsonb,
  certifications text[],
  instagram_link text,
  twitter_link text,
  youtube_link text,
  tiktok_link text,
  website_link text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- --- 2. Recruitments ---
CREATE TABLE public.recruitments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_body_part text,
  event_date timestamptz,
  location text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.recruitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruitments are viewable by everyone." ON public.recruitments FOR SELECT USING (true);
CREATE POLICY "Users can create recruitments." ON public.recruitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recruitments." ON public.recruitments FOR UPDATE USING (auth.uid() = user_id);

-- --- 3. Groups ---
CREATE TABLE public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are viewable by everyone." ON public.groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups." ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- --- 4. Group Members ---
CREATE TABLE public.group_members (
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members are viewable by everyone." ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups." ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- --- 5. 自動プロフィール作成トリガー ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 実行後は supabase-consolidated-setup.sql を実行して
-- conversations / messages / follows / blocks / reports 等を再度作成してください。
-- ============================================
