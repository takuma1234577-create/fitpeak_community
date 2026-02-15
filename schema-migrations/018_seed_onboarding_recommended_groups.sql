-- 018: オンボーディングおすすめ用の公式グループを追加
-- ガチトレしたい人の集まり / ゆるトレの会 / ベンチプレス100kg目指す会
-- 使い方: SQL Editor で実行

DO $$
DECLARE
  admin_id uuid;
  conv_id uuid;
  grp_id uuid;
  grp_rec record;
  groups_to_create text[] := ARRAY[
    'ガチトレしたい人の集まり',
    'ゆるトレの会',
    'ベンチプレス100kg目指す会'
  ];
  descriptions text[] := ARRAY[
    'ガチで筋トレに取り組む人のための公式グループ。高負荷・高頻度で本気で成長したい仲間が集まります。',
    'ゆるく楽しく筋トレを続けたい人のための公式グループ。無理せず長く続ける仲間が集まります。',
    'ベンチプレス100kg達成を目指す人のための公式グループ。目標を共有して一緒に頑張りましょう。'
  ];
  i int;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'takuma1234577@gmail.com' LIMIT 1;
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'ユーザーが見つかりません。';
  END IF;

  INSERT INTO public.profiles (id, username, nickname)
  VALUES (admin_id, '管理者', '管理者')
  ON CONFLICT (id) DO NOTHING;

  FOR i IN 1..array_length(groups_to_create, 1)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE name = groups_to_create[i] AND category = '公式' AND prefecture IS NULL) THEN
      INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;

      INSERT INTO public.groups (name, description, category, created_by, is_private, chat_room_id, prefecture, header_url)
      VALUES (
        groups_to_create[i],
        descriptions[i],
        '公式',
        admin_id,
        false,
        conv_id,
        NULL,
        'https://placehold.jp/72/0f172a/d4af37/800x450.png?text=' || groups_to_create[i]
      )
      RETURNING id INTO grp_id;

      INSERT INTO public.group_members (group_id, user_id) VALUES (grp_id, admin_id);
      INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (conv_id, admin_id);

      RAISE NOTICE '「%」を作成しました。', groups_to_create[i];
    ELSE
      RAISE NOTICE '「%」は既に存在します。', groups_to_create[i];
    END IF;
  END LOOP;
END $$;
