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

/** 新規ユーザー（created_at で登録日表示用） */
export type NewArrivalUser = RecommendedUser & { created_at: string };

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

const RECOMMENDED_USERS_TARGET = 5;

function toRecommendedUser(row: Record<string, unknown>): RecommendedUser {
  return {
    id: row.id as string,
    nickname: (row.nickname as string | null) ?? null,
    username: (row.username as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    prefecture: (row.prefecture as string | null) ?? null,
    home_gym: (row.home_gym as string | null) ?? null,
    exercises: Array.isArray(row.exercises) ? (row.exercises as string[]) : null,
  };
}

/**
 * おすすめのユーザー: 最大5人を返す。
 * Step1: ジム・エリア・種目マッチで取得（最大5）。
 * Step2: 5人未満なら不足分をランダムで補填（ORDER BY RANDOM()）。
 */
export async function getRecommendedUsers(
  supabase: SupabaseClient,
  myProfile: MyProfile | null,
  myId: string,
  limit = RECOMMENDED_USERS_TARGET
): Promise<RecommendedUser[]> {
  const sb = supabase as any;
  const target = Math.min(limit, RECOMMENDED_USERS_TARGET);
  const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises";

  // Step 1: おすすめ（ジム・住まい・種目一致）で最大 target 名
  const promises: Promise<{ data: RecommendedUser[] | null }>[] = [];

  if (myProfile?.home_gym?.trim()) {
    const pattern = `%${myProfile.home_gym.trim()}%`;
    promises.push(
      sb.from("profiles").select(fields).neq("id", myId).ilike("home_gym", pattern).limit(target)
    );
  }
  if (myProfile?.prefecture?.trim()) {
    promises.push(
      sb
        .from("profiles")
        .select(fields)
        .neq("id", myId)
        .eq("prefecture", myProfile.prefecture.trim())
        .limit(target)
    );
  }
  if (myProfile?.exercises?.length) {
    const ex = myProfile.exercises.filter(Boolean);
    if (ex.length > 0) {
      promises.push(
        sb.from("profiles").select(fields).neq("id", myId).overlaps("exercises", ex).limit(target)
      );
    }
  }

  const seen = new Set<string>();
  const merged: RecommendedUser[] = [];

  if (promises.length > 0) {
    const results = await Promise.all(promises);
    for (const res of results) {
      const list = (res.data ?? []) as RecommendedUser[];
      for (const row of list) {
        if (row.id !== myId && !seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row);
        }
      }
    }
  }
  const step1 = merged.slice(0, target);

  // Step 2: 不足分をランダムで補填（自分と Step1 の ID を除外）
  const need = target - step1.length;
  if (need <= 0) {
    return step1;
  }

  const excludeIds = [myId, ...step1.map((u) => u.id)];
  const { data: randomRows, error } = await sb.rpc("get_random_profiles", {
    p_exclude_ids: excludeIds,
    p_limit: need,
  });

  if (error || !Array.isArray(randomRows)) {
    return step1;
  }

  for (const row of randomRows as Record<string, unknown>[]) {
    const id = row?.id as string | undefined;
    if (id && !seen.has(id)) {
      seen.add(id);
      step1.push(toRecommendedUser(row as Record<string, unknown>));
    }
  }

  return step1.slice(0, target);
}

/**
 * 新規ユーザー: created_at の新しい順に 5〜10 名取得（自分を除く）
 */
export async function getNewArrivalUsers(
  supabase: SupabaseClient,
  myId: string,
  limit = 7
): Promise<NewArrivalUser[]> {
  const sb = supabase as any;
  const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, created_at";
  const { data, error } = await sb
    .from("profiles")
    .select(fields)
    .neq("id", myId)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 10));
  if (error || !Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    ...toRecommendedUser(row),
    created_at: (row.created_at as string) ?? "",
  })) as NewArrivalUser[];
}
