import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import {
  getMyProfile,
  getRecommendedUsers,
  getNewArrivalUsers,
} from "@/lib/recommendations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let recommendedUsers: Awaited<ReturnType<typeof getRecommendedUsers>> = [];
  let newArrivalUsers: Awaited<ReturnType<typeof getNewArrivalUsers>> = [];
  let myProfile: Awaited<ReturnType<typeof getMyProfile>> = null;
  let myUserId: string | null = null;

  if (user) {
    myUserId = user.id;
    try {
      myProfile = await getMyProfile(supabase, user.id);
      [recommendedUsers, newArrivalUsers] = await Promise.all([
        getRecommendedUsers(supabase, myProfile, user.id, 5),
        getNewArrivalUsers(supabase, user.id, 7),
      ]);
    } catch (e) {
      console.error("Dashboard recommendations fetch error:", e);
    }
  }

  return (
    <HomePage
      recommendedUsers={recommendedUsers}
      newArrivalUsers={newArrivalUsers}
      myUserId={myUserId}
    />
  );
}
