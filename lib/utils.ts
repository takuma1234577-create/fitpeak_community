import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * データ変換レイヤー: どんな値が来ても安全な配列に変換する。
 * Shadcn UI (Select / Carousel) などに渡す前に必ずこれを通す。
 */
export function safeArray<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}
