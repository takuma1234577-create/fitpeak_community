import { PREFECTURES } from "@/lib/constants";
import { safeArray } from "@/lib/utils";

export const BODY_PARTS = [
  { value: "all", label: "全部位" },
  { value: "chest", label: "胸" },
  { value: "back", label: "背中" },
  { value: "legs", label: "脚" },
  { value: "shoulders", label: "肩" },
  { value: "arms", label: "腕" },
  { value: "full", label: "全身" },
] as const;

export const LEVEL_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "beginner", label: "初心者" },
  { value: "intermediate", label: "中級者" },
  { value: "advanced", label: "上級者" },
  { value: "competitor", label: "大会勢" },
] as const;

export const LEVEL_FILTER_OPTIONS = [
  { value: "all", label: "全レベル" },
  { value: "beginner", label: "初心者" },
  { value: "intermediate", label: "中級者" },
  { value: "advanced", label: "上級者" },
  { value: "competitor", label: "大会勢" },
] as const;

const _TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, "0");
  _TIME_OPTIONS.push({ value: `${hh}:00`, label: `${hh}:00` });
  _TIME_OPTIONS.push({ value: `${hh}:30`, label: `${hh}:30` });
}
export const TIME_OPTIONS = _TIME_OPTIONS;

export const SORT_OPTIONS: { value: "newest" | "date_nearest" | "date_furthest"; label: string }[] = [
  { value: "newest", label: "作成順" },
  { value: "date_nearest", label: "開催日が近い順" },
  { value: "date_furthest", label: "開催日が遠い順" },
];

export function getPrefectures(): readonly string[] {
  return safeArray(PREFECTURES);
}
