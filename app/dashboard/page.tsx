import HomePage from "@/components/dashboard/home-page";
import { createClient } from "@/utils/supabase/server";
import {
  getMyProfile,
  getRecommendedWorkouts,
  getRecommendedUsers,
} from "@/lib/recommendations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let recommendedWorkouts: Awaited<ReturnType<typeof getRecommendedWorkouts>> = [];
  let recommendedUsers: Awaited<ReturnType<typeof getRecommendedUsers>> = [];
  let myProfile: Awaited<ReturnType<typeof getMyProfile>> = null;

  if (user) {
    myProfile = await getMyProfile(supabase, user.id);
    [recommendedWorkouts, recommendedUsers] = await Promise.all([
      getRecommendedWorkouts(supabase, myProfile, 10),
      getRecommendedUsers(supabase, myProfile, user.id, 5),
    ]);
  }

  return (
    <HomePage
      recommendedWorkouts={recommendedWorkouts}
      recommendedUsers={recommendedUsers}
    />
  );
}
