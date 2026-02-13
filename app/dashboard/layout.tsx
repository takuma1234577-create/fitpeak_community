import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isProfileCompleted } from "@/lib/profile-completed";
import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, nickname, username, bio, prefecture, exercises")
      .eq("id", user.id)
      .maybeSingle();
    if (!isProfileCompleted(profile)) {
      redirect("/onboarding");
    }
  }
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
