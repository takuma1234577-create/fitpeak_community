/** 47都道府県（北海道・東北…九州・沖縄の順） */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

/** エクササイズ・種目（複数選択用） */
export const EXERCISE_OPTIONS = [
  "ウェイトリフティング",
  "パワーリフティング",
  "ボディビル",
  "フィジーク",
  "ヨガ",
  "有酸素",
  "クロスフィット",
  "ダイエット",
  "その他",
] as const;

export type ExerciseOption = (typeof EXERCISE_OPTIONS)[number];

export const GENDER_OPTIONS = [
  { value: "Male", label: "男性" },
  { value: "Female", label: "女性" },
  { value: "Other", label: "その他" },
] as const;

/** 人気のキーワード（検索窓・検索画面で表示） */
export const POPULAR_SEARCH_KEYWORDS = [
  "#ベンチプレス",
  "#東京",
  "#初心者歓迎",
  "#合トレ",
  "#減量",
] as const;

/** 人気のキーワード（検索窓・検索画面で表示） */
export const POPULAR_SEARCH_KEYWORDS = [
  "#ベンチプレス",
  "#東京",
  "#初心者歓迎",
  "#合トレ",
  "#減量",
] as const;
