-- 015: 公式グループ「トレーニーの集まり場」を追加
-- 管理者: takuma1234577@gmail.com
-- 使い方: このファイルをすべてコピーして SQL Editor に貼り付け、Run をクリック
-- 注意: 013（prefecture カラム追加）を実行済みであること

DO $$
DECLARE
  admin_id uuid;
  conv_id uuid;
  grp_id uuid;
  grp_name text := 'トレーニーの集まり場';
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'takuma1234577@gmail.com' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION '管理者ユーザーが見つかりません。takuma1234577@gmail.com で登録されているか確認してください。';
  END IF;

  -- 既に存在する場合はスキップ
  IF EXISTS (SELECT 1 FROM public.groups WHERE name = grp_name AND category = '公式' AND prefecture IS NULL) THEN
    RAISE NOTICE '「トレーニーの集まり場」は既に存在します。';
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, username, nickname)
  VALUES (admin_id, '管理者', '管理者')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;

  INSERT INTO public.groups (name, description, category, created_by, is_private, chat_room_id, prefecture, header_url)
  VALUES (
    grp_name,
    '全国のトレーニーが集まる公式グループです。筋トレ仲間を見つけたり、情報交換・合トレの募集ができます。',
    '公式',
    admin_id,
    false,
    conv_id,
    NULL,
    'https://placehold.jp/72/0f172a/d4af37/800x450.png?text=' || grp_name
  )
  RETURNING id INTO grp_id;

  INSERT INTO public.group_members (group_id, user_id) VALUES (grp_id, admin_id);
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (conv_id, admin_id);

  RAISE NOTICE '「トレーニーの集まり場」を作成しました。';
END $$;
