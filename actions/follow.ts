"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function followUser(profileUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  if (user.id === profileUserId) return { error: "自分自身をフォローできません" };
  const { error } = await (supabase as any)
    .from("follows")
    .insert({ follower_id: user.id, following_id: profileUserId });
  if (error) return { error: error.message };

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("nickname, username")
    .eq("id", user.id)
    .single();
  const myName = (myProfile as { nickname?: string | null; username?: string | null } | null)?.nickname
    || (myProfile as { username?: string | null } | null)?.username
    || "誰か";

  try {
    await (supabase as any).from("notifications").insert({
      user_id: profileUserId,
      sender_id: user.id,
      type: "follow",
      content: `${myName}さんがあなたをフォローしました`,
      link: "/dashboard/notifications",
    });
  } catch {
    // type 'follow' 未追加の場合はスキップ
  }

  try {
    await fetch(`${getBaseUrl()}/api/notify-follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        following_id: profileUserId,
        follower_id: user.id,
      }),
    });
  } catch {
    // メール送信は省略可
  }

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
