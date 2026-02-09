"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function followUser(profileUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  if (user.id === profileUserId) return { error: "自分自身をフォローできません" };
  const { error } = await (supabase as any)
    .from("follows")
    .insert({ follower_id: user.id, following_id: profileUserId });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return {};
}

export async function unfollowUser(profileUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  const { error } = await (supabase as any)
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", profileUserId);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return {};
}
