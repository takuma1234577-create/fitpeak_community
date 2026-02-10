/** フィルター用: 部位 */
export const BODY_PARTS = [
  { value: "all", label: "全部位" },
  { value: "chest", label: "胸" },
  { value: "back", label: "背中" },
  { value: "legs", label: "脚" },
  { value: "shoulders", label: "肩" },
  { value: "arms", label: "腕" },
  { value: "full", label: "全身" },
] as const;

/** フィルター用: レベル */
export const LEVELS = [
  { value: "all", label: "全レベル" },
  { value: "beginner", label: "初心者" },
  { value: "intermediate", label: "中級者" },
  { value: "advanced", label: "上級者" },
  { value: "competitor", label: "大会勢" },
] as const;

export type BodyPartValue = (typeof BODY_PARTS)[number]["value"];
export type LevelValue = (typeof LEVELS)[number]["value"];
