import type { SupabaseClient } from "@supabase/supabase-js";
import { safeList, normalizeRecruitment, normalizeProfile } from "@/lib/data-sanitizer";
import { isProfileCompleted } from "@/lib/profile-completed";

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
  /** 年齢計算用。is_age_public が true のときのみ表示 */
  birthday: string | null;
  is_age_public: boolean;
  gender: string | null;
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
  try {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, prefecture, home_gym, exercises")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as MyProfile;
  } catch (e) {
    console.error("getMyProfile error:", e);
    return null;
  }
}

/**
 * おすすめの合トレ: エリアマッチ or 部位マッチ、新着順
 */
export async function getRecommendedWorkouts(
  supabase: SupabaseClient,
  myProfile: MyProfile | null,
  limit = 10
): Promise<RecruitmentWithProfile[]> {
  try {
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
      return safeList(data as Record<string, unknown>[]).map((r) => {
        const norm = normalizeRecruitment(r);
        return (norm ?? r) as RecruitmentWithProfile;
      });
    }

    const results = await Promise.all(promises);
    const seen = new Set<string>();
    const merged: RecruitmentWithProfile[] = [];
    for (const res of results) {
      const list = safeList(res.data as Record<string, unknown>[]).map((r) => {
        const norm = normalizeRecruitment(r);
        return (norm ?? r) as RecruitmentWithProfile;
      });
      for (const row of list) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row);
        }
      }
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged.slice(0, limit);
  } catch (e) {
    console.error("getRecommendedWorkouts error:", e);
    return [];
  }
}

const RECOMMENDED_USERS_TARGET = 5;

function toRecommendedUser(row: Record<string, unknown>): RecommendedUser {
  const normalized = normalizeProfile(row);
  const r = normalized ?? row;
  return {
    id: r.id as string,
    nickname: (r.nickname as string | null) ?? null,
    username: (r.username as string | null) ?? null,
    bio: (r.bio as string | null) ?? null,
    avatar_url: (r.avatar_url as string | null) ?? null,
    prefecture: (r.prefecture as string | null) ?? null,
    home_gym: (r.home_gym as string | null) ?? null,
    exercises: (() => {
      const arr = safeList(r.exercises as string[] | null);
      return arr.length > 0 ? arr : null;
    })(),
    birthday: (r.birthday as string | null) ?? null,
    is_age_public: (r.is_age_public as boolean) ?? true,
    gender: (r.gender as string | null) ?? null,
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
  try {
    const sb = supabase as any;
    const target = Math.min(limit, RECOMMENDED_USERS_TARGET);
    const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, birthday, is_age_public, gender";

    // Step 1: おすすめ（ジム・住まい・種目一致）で最大 target 名
    const promises: Promise<{ data: RecommendedUser[] | null }>[] = [];

    const visibleFilter = () =>
      sb
        .from("profiles")
        .select(fields)
        .neq("id", myId)
        .eq("email_confirmed", true)
        .not("nickname", "is", null)
        .not("avatar_url", "is", null)
        .not("bio", "is", null)
        .not("prefecture", "is", null)
        .not("exercises", "is", null);
    if (myProfile?.home_gym?.trim()) {
      const pattern = `%${myProfile.home_gym.trim()}%`;
      promises.push(visibleFilter().ilike("home_gym", pattern).limit(target));
    }
    if (myProfile?.prefecture?.trim()) {
      promises.push(
        visibleFilter().eq("prefecture", myProfile.prefecture.trim()).limit(target)
      );
    }
    if (myProfile?.exercises?.length) {
      const ex = myProfile.exercises.filter(Boolean);
      if (ex.length > 0) {
        promises.push(visibleFilter().overlaps("exercises", ex).limit(target));
      }
    }

    const seen = new Set<string>();
    const merged: RecommendedUser[] = [];

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      for (const res of results) {
        const list = (res.data ?? []) as Record<string, unknown>[];
        for (const row of list) {
          if (!isProfileCompleted(row)) continue;
          const id = row?.id as string;
          if (id !== myId && !seen.has(id)) {
            seen.add(id);
            merged.push(toRecommendedUser(row));
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

    if (error) {
      return step1;
    }

    for (const row of safeList(randomRows as Record<string, unknown>[])) {
      if (!isProfileCompleted(row)) continue;
      const id = row?.id as string | undefined;
      if (id && !seen.has(id)) {
        seen.add(id);
        step1.push(toRecommendedUser(row as Record<string, unknown>));
      }
    }

    return step1.slice(0, target);
  } catch (e) {
    console.error("getRecommendedUsers error:", e);
    return [];
  }
}

/**
 * 全国共通の公式グループ（prefecture が NULL）を取得（例: トレーニーの集まり場）
 * おすすめページで常に表示するグループ
 */
export async function getGeneralOfficialGroups(
  supabase: SupabaseClient
): Promise<{ id: string; name: string; description: string | null; chat_room_id: string | null }[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("groups")
      .select("id, name, description, chat_room_id")
      .eq("category", "公式")
      .is("prefecture", null)
      .order("created_at", { ascending: true });
    if (error || !data?.length) return [];
    return data as { id: string; name: string; description: string | null; chat_room_id: string | null }[];
  } catch (e) {
    console.error("getGeneralOfficialGroups error:", e);
    return [];
  }
}

/**
 * 都道府県の公式グループを取得
 */
export async function getOfficialGroupForPrefecture(
  supabase: SupabaseClient,
  prefecture: string
): Promise<{ id: string; name: string; description: string | null; chat_room_id: string | null } | null> {
  if (!prefecture?.trim()) return null;
  try {
    const { data, error } = await (supabase as any)
      .from("groups")
      .select("id, name, description, chat_room_id")
      .eq("category", "公式")
      .eq("prefecture", prefecture.trim())
      .maybeSingle();
    if (error || !data) return null;
    return data as { id: string; name: string; description: string | null; chat_room_id: string | null };
  } catch (e) {
    console.error("getOfficialGroupForPrefecture error:", e);
    return null;
  }
}

/**
 * おすすめユーザー: created_at の新しい順（新規登録順）で取得。
 * myId が渡されていれば自分を除く。過去登録者も含め全員が対象。
 * 1) メール確認済み＆ニックネームありを優先して新規登録順で取得。
 * 2) 0人のときは条件を外し、全プロフィールを新規登録順で取得。
 */
export async function getNewArrivalUsers(
  supabase: SupabaseClient,
  myId: string | null,
  limit = 7
): Promise<NewArrivalUser[]> {
  try {
    const sb = supabase as any;
    const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, birthday, is_age_public, gender, created_at";
    const maxLimit = Math.min(limit * 3, 30);

    const baseQuery = () =>
      sb
        .from("profiles")
        .select(fields)
        .order("created_at", { ascending: false })
        .limit(maxLimit)
        .eq("email_confirmed", true)
        .not("nickname", "is", null)
        .not("avatar_url", "is", null)
        .not("bio", "is", null)
        .not("prefecture", "is", null)
        .not("exercises", "is", null);

    let query = baseQuery();
    if (myId) query = query.neq("id", myId);
    const { data, error } = await query;

    if (!error && data?.length) {
      const completed = safeList(data as Record<string, unknown>[]).filter((row) => isProfileCompleted(row));
      return completed.slice(0, limit).map((row) => ({
        ...toRecommendedUser(row),
        created_at: (row.created_at as string) ?? "",
      })) as NewArrivalUser[];
    }

    let fallbackQuery = baseQuery();
    if (myId) fallbackQuery = fallbackQuery.neq("id", myId);
    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (!fallbackError && fallbackData?.length) {
      const completed = safeList(fallbackData as Record<string, unknown>[]).filter((row) => isProfileCompleted(row));
      return completed.slice(0, limit).map((row) => ({
        ...toRecommendedUser(row),
        created_at: (row.created_at as string) ?? "",
      })) as NewArrivalUser[];
    }

    return [];
  } catch (e) {
    console.error("getNewArrivalUsers error:", e);
    return [];
  }
}
