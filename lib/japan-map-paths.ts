/**
 * Japan prefecture tile map data
 * Grid-based "deformed map" (デフォルメ地図) layout
 * Each prefecture is a rectangular tile placed on a CSS grid
 */

export type RegionKey =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu";

export const REGION_LABELS: Record<RegionKey, string> = {
  hokkaido: "北海道",
  tohoku: "東北",
  kanto: "関東",
  chubu: "中部",
  kinki: "近畿",
  chugoku: "中国",
  shikoku: "四国",
  kyushu: "九州・沖縄",
};

export const REGION_ORDER: RegionKey[] = [
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kinki",
  "chugoku",
  "shikoku",
  "kyushu",
];

export type TilePrefecture = {
  name: string;
  region: RegionKey;
  col: number;
  row: number;
  colSpan?: number;
  rowSpan?: number;
};

export const PREFECTURE_REGION_MAP: Record<string, RegionKey> = {
  北海道: "hokkaido",
  青森県: "tohoku",
  岩手県: "tohoku",
  宮城県: "tohoku",
  秋田県: "tohoku",
  山形県: "tohoku",
  福島県: "tohoku",
  茨城県: "kanto",
  栃木県: "kanto",
  群馬県: "kanto",
  埼玉県: "kanto",
  千葉県: "kanto",
  東京都: "kanto",
  神奈川県: "kanto",
  新潟県: "chubu",
  富山県: "chubu",
  石川県: "chubu",
  福井県: "chubu",
  山梨県: "chubu",
  長野県: "chubu",
  岐阜県: "chubu",
  静岡県: "chubu",
  愛知県: "chubu",
  三重県: "kinki",
  滋賀県: "kinki",
  京都府: "kinki",
  大阪府: "kinki",
  兵庫県: "kinki",
  奈良県: "kinki",
  和歌山県: "kinki",
  鳥取県: "chugoku",
  島根県: "chugoku",
  岡山県: "chugoku",
  広島県: "chugoku",
  山口県: "chugoku",
  徳島県: "shikoku",
  香川県: "shikoku",
  愛媛県: "shikoku",
  高知県: "shikoku",
  福岡県: "kyushu",
  佐賀県: "kyushu",
  長崎県: "kyushu",
  熊本県: "kyushu",
  大分県: "kyushu",
  宮崎県: "kyushu",
  鹿児島県: "kyushu",
  沖縄県: "kyushu",
};

/**
 * Grid positions for the tile map.
 * Uses a 12-column x 15-row grid.
 * col/row are 1-indexed (CSS grid-column / grid-row).
 */
export const TILE_PREFECTURES: TilePrefecture[] = [
  { name: "北海道", region: "hokkaido", col: 10, row: 1, colSpan: 2, rowSpan: 2 },
  { name: "青森県", region: "tohoku", col: 9, row: 3 },
  { name: "岩手県", region: "tohoku", col: 10, row: 3 },
  { name: "秋田県", region: "tohoku", col: 9, row: 4 },
  { name: "宮城県", region: "tohoku", col: 10, row: 4 },
  { name: "山形県", region: "tohoku", col: 9, row: 5 },
  { name: "福島県", region: "tohoku", col: 10, row: 5 },
  { name: "新潟県", region: "chubu", col: 8, row: 5 },
  { name: "富山県", region: "chubu", col: 7, row: 6 },
  { name: "長野県", region: "chubu", col: 8, row: 6 },
  { name: "石川県", region: "chubu", col: 6, row: 6 },
  { name: "福井県", region: "chubu", col: 6, row: 7 },
  { name: "岐阜県", region: "chubu", col: 7, row: 7 },
  { name: "山梨県", region: "chubu", col: 8, row: 7 },
  { name: "愛知県", region: "chubu", col: 7, row: 8 },
  { name: "静岡県", region: "chubu", col: 8, row: 8 },
  { name: "群馬県", region: "kanto", col: 9, row: 6 },
  { name: "栃木県", region: "kanto", col: 10, row: 6 },
  { name: "茨城県", region: "kanto", col: 11, row: 6 },
  { name: "埼玉県", region: "kanto", col: 9, row: 7 },
  { name: "東京都", region: "kanto", col: 10, row: 7 },
  { name: "千葉県", region: "kanto", col: 11, row: 7 },
  { name: "神奈川県", region: "kanto", col: 10, row: 8 },
  { name: "京都府", region: "kinki", col: 5, row: 7 },
  { name: "滋賀県", region: "kinki", col: 6, row: 8 },
  { name: "兵庫県", region: "kinki", col: 5, row: 8 },
  { name: "大阪府", region: "kinki", col: 6, row: 9 },
  { name: "奈良県", region: "kinki", col: 7, row: 9 },
  { name: "三重県", region: "kinki", col: 7, row: 10 },
  { name: "和歌山県", region: "kinki", col: 6, row: 10 },
  { name: "島根県", region: "chugoku", col: 3, row: 7 },
  { name: "鳥取県", region: "chugoku", col: 4, row: 7 },
  { name: "広島県", region: "chugoku", col: 3, row: 8 },
  { name: "岡山県", region: "chugoku", col: 4, row: 8 },
  { name: "山口県", region: "chugoku", col: 2, row: 8 },
  { name: "香川県", region: "shikoku", col: 4, row: 9 },
  { name: "徳島県", region: "shikoku", col: 5, row: 9 },
  { name: "愛媛県", region: "shikoku", col: 4, row: 10 },
  { name: "高知県", region: "shikoku", col: 5, row: 10 },
  { name: "福岡県", region: "kyushu", col: 2, row: 9 },
  { name: "大分県", region: "kyushu", col: 3, row: 9 },
  { name: "佐賀県", region: "kyushu", col: 1, row: 10 },
  { name: "熊本県", region: "kyushu", col: 2, row: 10 },
  { name: "宮崎県", region: "kyushu", col: 3, row: 10 },
  { name: "長崎県", region: "kyushu", col: 1, row: 11 },
  { name: "鹿児島県", region: "kyushu", col: 2, row: 11 },
  { name: "沖縄県", region: "kyushu", col: 1, row: 13 },
];

export const GRID_COLS = 12;
export const GRID_ROWS = 14;

export function getPrefecturesByRegion(region: RegionKey): string[] {
  return TILE_PREFECTURES.filter((p) => p.region === region).map((p) => p.name);
}

/**
 * 都道府県の正式名から、DBに保存されうる値のリストを返す。
 * 例: "東京都" → ["東京都", "東京"]（過去に略称で保存されたユーザーもヒットさせる）
 */
export function getPrefectureMatchValues(canonicalName: string): string[] {
  const uniq = (arr: string[]) => [...new Set(arr)];
  if (canonicalName === "北海道") return ["北海道"];
  if (canonicalName === "東京都") return uniq(["東京都", "東京"]);
  if (canonicalName === "大阪府") return uniq(["大阪府", "大阪"]);
  if (canonicalName === "京都府") return uniq(["京都府", "京都"]);
  if (canonicalName.endsWith("県"))
    return uniq([canonicalName, canonicalName.slice(0, -1)]);
  if (canonicalName.endsWith("府") || canonicalName.endsWith("都"))
    return uniq([canonicalName, canonicalName.slice(0, -1)]);
  return [canonicalName];
}

/** 保存値（"東京"など）をマップ用の正式名（"東京都"）に正規化するためのマップ */
let _normalizeMap: Record<string, string> | null = null;

export function normalizePrefectureToCanonical(stored: string): string {
  if (!_normalizeMap) {
    _normalizeMap = {} as Record<string, string>;
    for (const tile of TILE_PREFECTURES) {
      for (const v of getPrefectureMatchValues(tile.name)) {
        _normalizeMap[v] = tile.name;
      }
    }
  }
  const trimmed = stored.trim();
  return trimmed ? _normalizeMap[trimmed] ?? trimmed : trimmed;
}
