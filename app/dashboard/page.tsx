import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import { getNewArrivalUsers } from "@/lib/recommendations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let newArrivalUsers: Awaited<ReturnType<typeof getNewArrivalUsers>> = [];
  let myUserId: string | null = null;

  if (user) {
    myUserId = user.id;
    try {
      newArrivalUsers = await getNewArrivalUsers(supabase, user.id, 7);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  }

  return (
    <HomePage
      newArrivalUsers={newArrivalUsers}
      myUserId={myUserId}
    />
  );
}
