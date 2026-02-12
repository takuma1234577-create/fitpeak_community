import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPrefectureCounts } from "@/lib/prefecture-counts";

export const dynamic = "force-dynamic";

/**
 * 都道府県マップ用の人数集計を返す。
 * profiles の SQL 集計結果を正規化したもの（Realtime 反映時にクライアントから呼ぶ）。
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const counts = await getPrefectureCounts(supabase);
    return NextResponse.json({ counts });
  } catch (e) {
    console.error("prefecture-counts API error:", e);
    return NextResponse.json({ counts: {} }, { status: 200 });
  }
}
