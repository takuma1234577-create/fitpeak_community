import { normalizePrefectureToCanonical } from "@/lib/japan-map-paths";

export type PrefectureCounts = Record<string, number>;

/**
 * SQL の get_prefecture_counts_raw() で集計した結果を取得し、
 * 正式都道府県名に正規化してマップ用のカウントを返す。
 * 過去ユーザー・プロフィール変更も同一の導線で反映される。
 */
export async function getPrefectureCounts(supabase: any): Promise<PrefectureCounts> {
  const { data: rows, error } = await supabase.rpc("get_prefecture_counts_raw");
  const counts: PrefectureCounts = {};
  if (error || !Array.isArray(rows)) return counts;
  for (const row of rows as { pref?: string; cnt?: number }[]) {
    const pref = row?.pref != null ? String(row.pref).trim() : "";
    if (!pref) continue;
    const canonical = normalizePrefectureToCanonical(pref);
    if (canonical) counts[canonical] = (counts[canonical] ?? 0) + Number(row?.cnt ?? 0);
  }
  return counts;
}
