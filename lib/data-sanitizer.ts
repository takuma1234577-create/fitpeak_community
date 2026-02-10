/**
 * データ正規化レイヤー（Data Normalization）
 * Supabase は関連が0件のときに null を返すため、取得直後に必ずこのレイヤーを通し、
 * 「配列であるべきプロパティは必ず配列」を保証して .map is not a function を根絶する。
 */

/**
 * 配列が null/undefined の場合に空配列を返す安全装置。
 * UI や .map に渡す前に必ずこれを通す。
 */
export function safeList<T>(list: T[] | null | undefined): T[] {
  return Array.isArray(list) ? list : [];
}

/**
 * Supabase の select() が稀に単一オブジェクトで返す場合に対応。
 * 配列ならそのまま、単一オブジェクトなら [obj]、それ以外は []。
 */
export function ensureArray<T>(data: T[] | T | null | undefined): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") return [data as T];
  return [];
}

/**
 * プロフィールの生データを正規化する。
 * すべての配列・リレーションを safeList でラップし、null を [] に統一する。
 */
export function normalizeProfile(raw: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  return {
    ...raw,
    exercises: safeList(raw.exercises as string[] | null).map((x) => String(x)),
    achievements: safeList(raw.achievements as unknown[]).map((a) =>
      typeof a === "object" && a != null ? a : {}
    ),
    certifications: safeList(raw.certifications as string[] | null).map((x) => String(x)),
    recruitments: safeList(raw.recruitments as unknown[]).map((r) => normalizeRecruitment(r as Record<string, unknown>)),
    tags: safeList(raw.tags as unknown[]),
    interests: safeList(raw.interests as unknown[]),
    followers: safeList(raw.followers as unknown[]),
    following: safeList(raw.following as unknown[]),
    groups: safeList(raw.groups as unknown[]),
  };
}

/**
 * 募集（recruitment）の生データを正規化する。
 * tags / images / participants / areas 等を必ず配列にする。
 */
export function normalizeRecruitment(
  raw: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  const tagsRaw = raw.tags;
  const tags = Array.isArray(tagsRaw)
    ? (tagsRaw as unknown[]).map((t) => String(t))
    : raw.target_body_part != null
      ? [String(raw.target_body_part)]
      : [];
  return {
    ...raw,
    tags,
    images: safeList(raw.images as unknown[]),
    participants: safeList(raw.participants as unknown[]),
    areas: safeList(raw.areas as unknown[]),
    profiles: raw.profiles != null && typeof raw.profiles === "object" ? raw.profiles : null,
  };
}

/**
 * Supabase の select で取得した「配列の結果」を正規化する。
 * data が null のときは [] を返し、各要素に normalizer を適用する。
 */
export function normalizeList<T, R>(
  data: T[] | T | null | undefined,
  normalizer: (item: T) => R
): R[] {
  const list = Array.isArray(data) ? data : data != null ? [data] : [];
  return list.map((item) => normalizer(item));
}
