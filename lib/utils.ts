import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * データ変換レイヤー: どんな値が来ても安全な配列に変換する。
 * Shadcn UI (Select / Carousel) などに渡す前に必ずこれを通す。
 * readonly 配列（as const）も受け付ける。
 */
export function safeArray<T>(data: readonly T[] | T[] | null | undefined): T[] {
  return Array.isArray(data) ? [...data] : [];
}

/** データ正規化レイヤー（safeList / normalizeProfile / normalizeRecruitment）の再エクスポート */
export { safeList, ensureArray, normalizeProfile, normalizeRecruitment, normalizeList } from "./data-sanitizer";
