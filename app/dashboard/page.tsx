import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import { getNewArrivalUsers } from "@/lib/recommendations";
import { normalizePrefectureToCanonical } from "@/lib/japan-map-paths";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const myUserId = user?.id ?? null;
  let recommendedUsers: Awaited<ReturnType<typeof getNewArrivalUsers>> = [];
  let prefectureCounts: Record<string, number> = {};

  try {
    const sb = supabase as any;
    const [usersResult, countsResult] = await Promise.all([
      getNewArrivalUsers(supabase, myUserId, 10),
      sb.from("profiles").select("prefecture, area").eq("email_confirmed", true),
    ]);

    recommendedUsers = usersResult;

    if (countsResult.error) {
      console.error("Dashboard prefecture counts error:", countsResult.error);
    }
    if (countsResult.data && Array.isArray(countsResult.data)) {
      for (const row of countsResult.data) {
        const r = row as { prefecture: string | null; area: string | null };
        const pref = (r.prefecture && String(r.prefecture).trim()) || (r.area && String(r.area).trim()) || null;
        if (pref) {
          const canonical = normalizePrefectureToCanonical(pref);
          prefectureCounts[canonical] = (prefectureCounts[canonical] || 0) + 1;
        }
      }
    }
  } catch (e) {
    console.error("Dashboard fetch error:", e);
  }

  return (
    <HomePage
      recommendedUsers={recommendedUsers}
      myUserId={myUserId}
      prefectureCounts={prefectureCounts}
    />
  );
}
