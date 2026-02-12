import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import { getNewArrivalUsers } from "@/lib/recommendations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const myUserId = user?.id ?? null;
  let recommendedUsers: Awaited<ReturnType<typeof getNewArrivalUsers>> = [];
  let prefectureCounts: Record<string, number> = {};

  try {
    const [usersResult, countsResult] = await Promise.all([
      getNewArrivalUsers(supabase, myUserId, 10),
      (supabase as any)
        .from("profiles")
        .select("prefecture, area")
        .eq("email_confirmed", true)
        .or("prefecture.not.is.null,area.not.is.null"),
    ]);

    recommendedUsers = usersResult;

    if (countsResult.data && Array.isArray(countsResult.data)) {
      for (const row of countsResult.data) {
        const r = row as { prefecture: string | null; area: string | null };
        const pref = (r.prefecture && r.prefecture.trim()) || (r.area && r.area.trim()) || null;
        if (pref) {
          prefectureCounts[pref] = (prefectureCounts[pref] || 0) + 1;
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
