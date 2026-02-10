import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import { getNewArrivalUsers } from "@/lib/recommendations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const myUserId = user?.id ?? null;
  let recommendedUsers: Awaited<ReturnType<typeof getNewArrivalUsers>> = [];
  try {
    recommendedUsers = await getNewArrivalUsers(supabase, myUserId, 10);
  } catch (e) {
    console.error("Dashboard fetch error:", e);
  }

  return (
    <HomePage
      recommendedUsers={recommendedUsers}
      myUserId={myUserId}
    />
  );
}
