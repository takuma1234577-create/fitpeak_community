-- 014: 47都道府県の公式グループを一括作成
-- 管理者: takuma1234577@gmail.com
-- 使い方: 013 を実行後、Supabase ダッシュボード → SQL Editor → このファイルの中身を貼り付けて Run
-- 注意: 管理者ユーザー（auth.users + profiles）が存在することが前提です
-- SECURITY DEFINER により RLS をバイパスして INSERT を実行します

CREATE OR REPLACE FUNCTION public.seed_official_prefecture_groups(admin_email text DEFAULT 'takuma1234577@gmail.com')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  pref text;
  conv_id uuid;
  grp_id uuid;
  prefectures text[] := ARRAY[
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION '管理者ユーザーが見つかりません。% で登録されているか確認してください。', admin_email;
  END IF;

  INSERT INTO public.profiles (id, username, nickname)
  VALUES (admin_id, '管理者', '管理者')
  ON CONFLICT (id) DO NOTHING;

  FOREACH pref IN ARRAY prefectures
  LOOP
    INSERT INTO public.conversations () VALUES () RETURNING id INTO conv_id;

    INSERT INTO public.groups (name, description, category, created_by, is_private, chat_room_id, prefecture)
    VALUES (
      'FITPEAK ' || pref,
      pref || 'の筋トレ仲間とつながる公式グループです。地域の仲間と情報交換や合トレの募集ができます。',
      '公式',
      admin_id,
      false,
      conv_id,
      pref
    )
    RETURNING id INTO grp_id;

    INSERT INTO public.group_members (group_id, user_id) VALUES (grp_id, admin_id);
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (conv_id, admin_id);
  END LOOP;

  RAISE NOTICE '47都道府県の公式グループを作成しました。';
END;
$$;

SELECT public.seed_official_prefecture_groups();
