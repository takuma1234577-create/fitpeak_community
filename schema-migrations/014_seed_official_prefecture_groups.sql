-- 014: 47都道府県の公式グループを一括作成
-- 管理者: takuma1234577@gmail.com
-- 使い方: このファイルをすべてコピーして SQL Editor に貼り付け、Run をクリック
-- 注意: 1文だけなので Explain ボタンを押さないこと。Run を使用

DO $$
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
  SELECT id INTO admin_id FROM auth.users WHERE email = 'takuma1234577@gmail.com' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION '管理者ユーザーが見つかりません。takuma1234577@gmail.com で登録されているか確認してください。';
  END IF;

  INSERT INTO public.profiles (id, username, nickname)
  VALUES (admin_id, '管理者', '管理者')
  ON CONFLICT (id) DO NOTHING;

  FOREACH pref IN ARRAY prefectures
  LOOP
    INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;

    INSERT INTO public.groups (name, description, category, created_by, is_private, chat_room_id, prefecture, header_url)
    VALUES (
      'FITPEAK ' || pref,
      pref || 'の筋トレ仲間とつながる公式グループです。地域の仲間と情報交換や合トレの募集ができます。',
      '公式',
      admin_id,
      false,
      conv_id,
      pref,
      'https://placehold.jp/72/0f172a/d4af37/800x450.png?text=' || pref
    )
    RETURNING id INTO grp_id;

    INSERT INTO public.group_members (group_id, user_id) VALUES (grp_id, admin_id);
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (conv_id, admin_id);
  END LOOP;

  RAISE NOTICE '47都道府県の公式グループを作成しました。';
END $$;
