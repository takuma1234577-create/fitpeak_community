import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPrefectureMatchValues } from "@/lib/japan-map-paths";
import { TILE_PREFECTURES } from "@/lib/japan-map-paths";

export const dynamic = "force-dynamic";

type PrefectureUserRow = {
  id: string;
  nickname: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  prefecture: string | null;
  created_at: string | null;
};

function getAllPrefectureMatchValues(): string[] {
  const uniq = new Set<string>();
  for (const p of TILE_PREFECTURES) {
    for (const v of getPrefectureMatchValues(p.name)) {
      uniq.add(v);
    }
  }
  return Array.from(uniq);
}

/**
 * 都道府県マップのモーダル用。指定都道府県に住むユーザー一覧を返す。
 * prefecture=all のときは全国のユーザー一覧を返す。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefecture = searchParams.get("prefecture");
    let matchValues: string[];
    if (prefecture === "all" || prefecture === "全国") {
      matchValues = getAllPrefectureMatchValues();
    } else if (!prefecture || !prefecture.trim()) {
      return NextResponse.json({ users: [] });
    } else {
      matchValues = getPrefectureMatchValues(prefecture.trim());
    }
    const supabase = await createClient();
    const { data: rows, error } = await (supabase as any).rpc("get_prefecture_users", {
      match_values: matchValues,
    });
    if (error) {
      console.error("prefecture-users RPC error:", error);
      return NextResponse.json({ users: [] });
    }
    const users = Array.isArray(rows)
      ? (rows as PrefectureUserRow[]).filter((r) => r?.id).map((r) => ({
          id: r.id,
          nickname: r.nickname ?? null,
          username: r.username ?? null,
          bio: r.bio ?? null,
          avatar_url: r.avatar_url ?? null,
          prefecture: r.prefecture ?? null,
          home_gym: null as string | null,
          exercises: null as string[] | null,
          created_at: r.created_at ?? undefined,
        }))
      : [];
    return NextResponse.json({ users });
  } catch (e) {
    console.error("prefecture-users API error:", e);
    return NextResponse.json({ users: [] });
  }
}
