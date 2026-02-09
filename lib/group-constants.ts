/** グループのカテゴリ（作成・編集時のドロップダウン） */
export const GROUP_CATEGORIES = [
  "パワーリフティング",
  "ウェイトリフティング",
  "有酸素",
  "減量",
  "ダイエット",
  "ヨガ",
  "コンテスト",
  "合トレ募集",
  "ゆるトレ",
  "その他",
] as const;

export type GroupCategory = (typeof GROUP_CATEGORIES)[number];
