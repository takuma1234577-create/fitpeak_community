import type { SupabaseClient } from "@supabase/supabase-js";

export type MyProfile = {
  id: string;
  prefecture: string | null;
  home_gym: string | null;
  exercises: string[] | null;
};

export type RecruitmentWithProfile = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    nickname: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export type RecommendedUser = {
  id: string;
  nickname: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  prefecture: string | null;
  home_gym: string | null;
  exercises: string[] | null;
};

/**
 * ログインユーザーのプロフィールを取得
 */
export async function getMyProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<MyProfile | null> {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, prefecture, home_gym, exercises")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as MyProfile;
}

/**
 * おすすめの合トレ: エリアマッチ or 部位マッチ、新着順
 */
export async function getRecommendedWorkouts(
  supabase: SupabaseClient,
  myProfile: MyProfile | null,
  limit = 10
): Promise<RecruitmentWithProfile[]> {
  const sb = supabase as any;
  const baseQuery = () =>
    sb.from("recruitments").select("*, profiles(id, nickname, username, avatar_url)").eq("status", "open");

  const promises: Promise<{ data: RecruitmentWithProfile[] | null }>[] = [];

  if (myProfile?.prefecture?.trim()) {
    const pattern = `%${myProfile.prefecture.trim()}%`;
    promises.push(
      baseQuery().ilike("location", pattern).order("created_at", { ascending: false }).limit(limit)
    );
  }
  if (myProfile?.exercises?.length) {
    const parts = myProfile.exercises.filter(Boolean);
    if (parts.length > 0) {
      promises.push(
        baseQuery()
          .in("target_body_part", parts)
          .order("created_at", { ascending: false })
          .limit(limit)
      );
    }
  }

  if (promises.length === 0) {
    const { data } = await baseQuery().order("created_at", { ascending: false }).limit(limit);
    return (data ?? []) as RecruitmentWithProfile[];
  }

  const results = await Promise.all(promises);
  const seen = new Set<string>();
  const merged: RecruitmentWithProfile[] = [];
  for (const res of results) {
    const list = (res.data ?? []) as RecruitmentWithProfile[];
    for (const row of list) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        merged.push(row);
      }
    }
  }
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return merged.slice(0, limit);
}

/**
 * おすすめのユーザー: ジム仲間 / エリア仲間 / 種目仲間、自分を除く
 */
export async function getRecommendedUsers(
  supabase: SupabaseClient,
  myProfile: MyProfile | null,
  myId: string,
  limit = 10
): Promise<RecommendedUser[]> {
  const sb = supabase as any;
  const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises";

  const promises: Promise<{ data: RecommendedUser[] | null }>[] = [];

  if (myProfile?.home_gym?.trim()) {
    const pattern = `%${myProfile.home_gym.trim()}%`;
    promises.push(
      sb.from("profiles").select(fields).neq("id", myId).ilike("home_gym", pattern).limit(limit)
    );
  }
  if (myProfile?.prefecture?.trim()) {
    promises.push(
      sb
        .from("profiles")
        .select(fields)
        .neq("id", myId)
        .eq("prefecture", myProfile.prefecture.trim())
        .limit(limit)
    );
  }
  if (myProfile?.exercises?.length) {
    const ex = myProfile.exercises.filter(Boolean);
    if (ex.length > 0) {
      promises.push(
        sb.from("profiles").select(fields).neq("id", myId).overlaps("exercises", ex).limit(limit)
      );
    }
  }

  if (promises.length === 0) {
    return [];
  }

  const results = await Promise.all(promises);
  const seen = new Set<string>();
  const merged: RecommendedUser[] = [];
  for (const res of results) {
    const list = (res.data ?? []) as RecommendedUser[];
    for (const row of list) {
      if (row.id !== myId && !seen.has(row.id)) {
        seen.add(row.id);
        merged.push(row);
      }
    }
  }
  return merged.slice(0, limit);
}
