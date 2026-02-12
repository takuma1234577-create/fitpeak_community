import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import { getNewArrivalUsers } from "@/lib/recommendations";
import { getPrefectureCounts } from "@/lib/prefecture-counts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const myUserId = user?.id ?? null;
  let recommendedUsers: Awaited<ReturnType<typeof getNewArrivalUsers>> = [];
  let prefectureCounts: Record<string, number> = {};

  try {
    const [usersResult, counts] = await Promise.all([
      getNewArrivalUsers(supabase, myUserId, 10),
      getPrefectureCounts(supabase as Parameters<typeof getPrefectureCounts>[0]),
    ]);
    recommendedUsers = usersResult;
    prefectureCounts = counts;
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
