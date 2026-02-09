/**
 * 合トレ募集フォームの defaultValues 用。
 * 配列フィールドに null が渡ると react-hook-form 内部の .map でクラッシュするため、
 * 必ず空配列を fallback する。
 */
export type RecruitmentInitialData = {
  title?: string | null;
  description?: string | null;
  target_body_part?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
  area?: string | null;
  level?: string | null;
  tags?: string[] | null;
  images?: string[] | null;
  areas?: string[] | null;
  participants?: unknown[] | null;
};

export type RecruitmentFormDefaultValues = {
  title: string;
  description: string;
  target_body_part: string;
  event_date: string;
  event_time: string;
  location: string;
  area: string;
  level: string;
  tags: string[];
  images: string[];
  areas: string[];
};

export function getSafeRecruitmentDefaultValues(
  initialData?: RecruitmentInitialData | null
): RecruitmentFormDefaultValues {
  return {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    target_body_part: initialData?.target_body_part ?? "",
    event_date: initialData?.event_date ?? "",
    event_time: initialData?.event_time ?? "12:00",
    location: initialData?.location ?? "",
    area: initialData?.area ?? "",
    level: initialData?.level ?? "",
    tags: initialData?.tags ?? [],
    images: initialData?.images ?? [],
    areas: initialData?.areas ?? [],
  };
}
