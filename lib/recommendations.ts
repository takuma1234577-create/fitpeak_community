import type { SupabaseClient } from "@supabase/supabase-js";
import { safeList, normalizeRecruitment, normalizeProfile } from "@/lib/data-sanitizer";
import { isProfileCompleted } from "@/lib/profile-completed";

export type MyProfile = {
  id: string;
  prefecture: string | null;
  home_gym: string | null;
  exercises: string[] | null;
  training_years?: number | null;
  training_level?: string | null;
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
      .select("id, prefecture, home_gym, exercises, training_years, training_level")
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
 * email_confirmed は緩和: 条件に合うユーザーがいない場合は filter なしで再試行（LINE ユーザー対応）
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

    const baseVisibleFilter = (useEmailConfirmed: boolean) => {
      let q = sb
        .from("profiles")
        .select(fields)
        .neq("id", myId)
        .not("nickname", "is", null)
        .not("avatar_url", "is", null)
        .not("bio", "is", null)
        .not("prefecture", "is", null)
        .not("exercises", "is", null);
      if (useEmailConfirmed) q = q.eq("email_confirmed", true);
      return q;
    };

    // Step 1: おすすめ（ジム・住まい・種目一致）で最大 target 名
    const promises: Promise<{ data: RecommendedUser[] | null }>[] = [];
    const visibleFilter = () => baseVisibleFilter(true);
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
    let step1 = merged.slice(0, target);

    // Step 1 fallback: 0人の場合、email_confirmed を外して再試行（LINE 等の OAuth ユーザー対応）
    if (step1.length === 0 && promises.length > 0) {
      const fallbackPromises: Promise<{ data: RecommendedUser[] | null }>[] = [];
      if (myProfile?.home_gym?.trim()) {
        const pattern = `%${myProfile.home_gym.trim()}%`;
        fallbackPromises.push(baseVisibleFilter(false).ilike("home_gym", pattern).limit(target));
      }
      if (myProfile?.prefecture?.trim()) {
        fallbackPromises.push(
          baseVisibleFilter(false).eq("prefecture", myProfile.prefecture.trim()).limit(target)
        );
      }
      if (myProfile?.exercises?.length) {
        const ex = myProfile.exercises.filter(Boolean);
        if (ex.length > 0) {
          fallbackPromises.push(baseVisibleFilter(false).overlaps("exercises", ex).limit(target));
        }
      }
      if (fallbackPromises.length > 0) {
        const fallbackResults = await Promise.all(fallbackPromises);
        for (const res of fallbackResults) {
          const list = (res.data ?? []) as Record<string, unknown>[];
          for (const row of list) {
            if (!isProfileCompleted(row)) continue;
            const id = row?.id as string;
            if (id !== myId && !seen.has(id)) {
              seen.add(id);
              step1.push(toRecommendedUser(row));
            }
          }
        }
        step1 = step1.slice(0, target);
      }
    }

    // Step 2: 不足分をランダムで補填（自分と Step1 の ID を除外）
    const need = target - step1.length;
    if (need <= 0) {
      return step1;
    }

    const excludeIds = [myId, ...step1.map((u) => u.id)];
    const { data: randomRows, error } = await sb.rpc("get_random_profiles", {
      p_exclude_ids: excludeIds,
      p_limit: Math.max(need * 3, 15),
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
 * オンボーディング用: 住まい（都道府県）の近い順で最大5人を返す。
 * 同じ都道府県を最優先、不足分は全国から補填。RPC に依存しない。
 */
export async function getRecommendedUsersForOnboarding(
  supabase: SupabaseClient,
  myProfile: MyProfile | null,
  myId: string,
  limit = 5
): Promise<RecommendedUser[]> {
  try {
    const sb = supabase as any;
    const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, birthday, is_age_public, gender";
    const seen = new Set<string>([myId]);
    const result: RecommendedUser[] = [];

    const baseQuery = (inclEmailFilter: boolean) => {
      let q = sb
        .from("profiles")
        .select(fields)
        .neq("id", myId)
        .not("nickname", "is", null)
        .not("avatar_url", "is", null)
        .not("bio", "is", null)
        .not("prefecture", "is", null)
        .not("exercises", "is", null);
      if (inclEmailFilter) q = q.eq("email_confirmed", true);
      return q;
    };

    // 1. 同じ都道府県を優先（最大5人）
    const pref = myProfile?.prefecture?.trim();
    if (pref) {
      for (const useEmail of [true, false]) {
        const { data } = await baseQuery(useEmail)
          .eq("prefecture", pref)
          .order("created_at", { ascending: false })
          .limit(limit);
        for (const row of safeList(data as Record<string, unknown>[])) {
          if (!isProfileCompleted(row)) continue;
          const id = row?.id as string;
          if (id && !seen.has(id)) {
            seen.add(id);
            result.push(toRecommendedUser(row));
            if (result.length >= limit) return result;
          }
        }
        if (result.length > 0) break;
      }
    }

    // 2. 不足分を全国から補填（新着順）
    if (result.length < limit) {
      for (const useEmail of [true, false]) {
        let q = sb
          .from("profiles")
          .select(fields)
          .neq("id", myId)
          .not("nickname", "is", null)
          .not("avatar_url", "is", null)
          .not("bio", "is", null)
          .not("prefecture", "is", null)
          .not("exercises", "is", null)
          .order("created_at", { ascending: false })
          .limit(Math.max(limit * 3, 20));
        if (useEmail) q = q.eq("email_confirmed", true);
        const { data } = await q;
        for (const row of safeList(data as Record<string, unknown>[])) {
          if (result.length >= limit) break;
          if (!isProfileCompleted(row)) continue;
          const id = row?.id as string;
          if (id && !seen.has(id)) {
            seen.add(id);
            result.push(toRecommendedUser(row));
          }
        }
        if (result.length >= limit) break;
      }
    }

    // 3. 0人の場合: 条件を緩めて再試行（ニックネーム・アバター・都道府県があれば表示）
    if (result.length === 0) {
      const hasMinimalProfile = (row: Record<string, unknown>) => {
        const nick = (row?.nickname ?? row?.username ?? "").toString().trim();
        const avatar = row?.avatar_url;
        const pref = (row?.prefecture ?? "").toString().trim();
        return nick.length > 0 && !!avatar && pref.length > 0;
      };
      for (const useEmail of [true, false]) {
        let q = sb
          .from("profiles")
          .select(fields)
          .neq("id", myId)
          .not("avatar_url", "is", null)
          .not("prefecture", "is", null)
          .order("created_at", { ascending: false })
          .limit(10);
        if (useEmail) q = q.eq("email_confirmed", true);
        const { data } = await q;
        for (const row of safeList(data as Record<string, unknown>[])) {
          if (result.length >= limit) break;
          if (!hasMinimalProfile(row)) continue;
          const id = row?.id as string;
          if (id && !seen.has(id)) {
            seen.add(id);
            result.push(toRecommendedUser(row));
          }
        }
        if (result.length > 0) break;
      }
    }

    return result.slice(0, limit);
  } catch (e) {
    console.error("getRecommendedUsersForOnboarding error:", e);
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

export type OfficialGroup = { id: string; name: string; description: string | null; chat_room_id: string | null };

/**
 * オンボーディングおすすめ用: 3つのグループを取得
 * 1. 都道府県グループ（必ず先頭）
 * 2. 上級者(training_level=advanced) → ガチトレしたい人の集まり、それ以外 → ゆるトレの会
 * 3. ベンチプレス100kg目指す会
 * @param prefectureOverride - myProfile.prefecture がない場合の都道府県（ページ側から渡す）
 */
export async function getRecommendedGroupsForOnboarding(
  supabase: SupabaseClient,
  myProfile: MyProfile | null,
  prefectureOverride?: string | null
): Promise<OfficialGroup[]> {
  try {
    const sb = supabase as any;
    const result: OfficialGroup[] = [];
    const seenIds = new Set<string>();

    const addGroup = (g: OfficialGroup | null) => {
      if (g && !seenIds.has(g.id)) {
        seenIds.add(g.id);
        result.push(g);
      }
    };

    // 1. 都道府県グループ（必ずおすすめ・先頭）
    const pref = (myProfile?.prefecture?.trim() || prefectureOverride?.trim() || "").trim();
    if (pref) {
      const prefGroup = await getOfficialGroupForPrefecture(supabase, pref);
      addGroup(prefGroup);
    }

    // 2. 上級者(training_level=advanced) → ガチトレ、中級・初級 → ゆるトレ
    const isAdvanced = myProfile?.training_level === "advanced";
    const levelGroupName = isAdvanced ? "ガチトレしたい人の集まり" : "ゆるトレの会";
    const { data: levelGroup } = await sb
      .from("groups")
      .select("id, name, description, chat_room_id")
      .eq("category", "公式")
      .eq("name", levelGroupName)
      .maybeSingle();
    addGroup(levelGroup as OfficialGroup | null);

    // 3. ベンチプレス100kg目指す会
    const { data: benchGroup } = await sb
      .from("groups")
      .select("id, name, description, chat_room_id")
      .eq("category", "公式")
      .eq("name", "ベンチプレス100kg目指す会")
      .maybeSingle();
    addGroup(benchGroup as OfficialGroup | null);

    // 018未実行時のフォールバック: 全国公式グループから不足分を補填（最大3つまで）
    if (result.length < 3) {
      const general = await getGeneralOfficialGroups(supabase);
      for (const g of general) {
        if (result.length >= 3) break;
        addGroup(g);
      }
    }

    return result;
  } catch (e) {
    console.error("getRecommendedGroupsForOnboarding error:", e);
    return [];
  }
}

/**
 * 都道府県の公式グループを取得
 * prefecture 列で検索し、見つからない場合は名前 "FITPEAK {都道府県}" でフォールバック
 */
export async function getOfficialGroupForPrefecture(
  supabase: SupabaseClient,
  prefecture: string
): Promise<{ id: string; name: string; description: string | null; chat_room_id: string | null } | null> {
  const pref = prefecture?.trim();
  if (!pref) return null;
  try {
    const sb = supabase as any;
    // 1. prefecture 列で検索
    let { data, error } = await sb
      .from("groups")
      .select("id, name, description, chat_room_id")
      .eq("category", "公式")
      .eq("prefecture", pref)
      .maybeSingle();
    if (!error && data) return data as { id: string; name: string; description: string | null; chat_room_id: string | null };
    // 2. フォールバック: 名前 "FITPEAK {都道府県}" で検索
    const namePattern = `FITPEAK ${pref}`;
    const res = await sb
      .from("groups")
      .select("id, name, description, chat_room_id")
      .eq("category", "公式")
      .eq("name", namePattern)
      .maybeSingle();
    if (res.error || !res.data) return null;
    return res.data as { id: string; name: string; description: string | null; chat_room_id: string | null };
  } catch (e) {
    console.error("getOfficialGroupForPrefecture error:", e);
    return null;
  }
}

/**
 * おすすめユーザー: created_at の新しい順（新規登録順）で取得。
 * myId が渡されていれば自分を除く。過去登録者も含め全員が対象。
 * 1) メール確認済みを優先して新規登録順で取得。
 * 2) 0人のときは email_confirmed を外して再試行（LINE 等の OAuth ユーザー対応）
 * 3) limit に満たないときは get_random_profiles で補填（より多くの候補から取得）
 */
export async function getNewArrivalUsers(
  supabase: SupabaseClient,
  myId: string | null,
  limit = 7
): Promise<NewArrivalUser[]> {
  try {
    const sb = supabase as any;
    const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, birthday, is_age_public, gender, created_at";
    const maxLimit = Math.max(limit * 5, 50);

    const baseFilters = () =>
      sb
        .from("profiles")
        .select(fields)
        .order("created_at", { ascending: false })
        .limit(maxLimit)
        .not("nickname", "is", null)
        .not("avatar_url", "is", null)
        .not("bio", "is", null)
        .not("prefecture", "is", null)
        .not("exercises", "is", null);

    const runQuery = (useEmailConfirmed: boolean) => {
      let q = baseFilters();
      if (useEmailConfirmed) q = q.eq("email_confirmed", true);
      if (myId) q = q.neq("id", myId);
      return q;
    };

    const collectCompleted = (rows: Record<string, unknown>[]) =>
      safeList(rows).filter((row) => isProfileCompleted(row));

    let completed: Record<string, unknown>[] = [];

    const { data, error } = await runQuery(true);
    if (!error && data?.length) {
      completed = collectCompleted(data as Record<string, unknown>[]);
    }

    if (completed.length === 0) {
      const { data: fallbackData, error: fallbackError } = await runQuery(false);
      if (!fallbackError && fallbackData?.length) {
        completed = collectCompleted(fallbackData as Record<string, unknown>[]);
      }
    }

    let result = completed.slice(0, limit).map((row) => ({
      ...toRecommendedUser(row),
      created_at: (row.created_at as string) ?? "",
    })) as NewArrivalUser[];

    if (result.length < limit) {
      const excludeIds = [myId, ...result.map((u) => u.id)].filter(Boolean) as string[];
      const need = Math.max(limit - result.length, 10);
      const { data: randomRows } = await sb.rpc("get_random_profiles", {
        p_exclude_ids: excludeIds,
        p_limit: need,
      });
      const seen = new Set(result.map((u) => u.id));
      for (const row of safeList(randomRows as Record<string, unknown>[])) {
        if (result.length >= limit) break;
        if (!isProfileCompleted(row)) continue;
        const id = row?.id as string | undefined;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        result.push({
          ...toRecommendedUser(row),
          created_at: (row.created_at as string) ?? "",
        } as NewArrivalUser);
      }
    }

    return result;
  } catch (e) {
    console.error("getNewArrivalUsers error:", e);
    return [];
  }
}
