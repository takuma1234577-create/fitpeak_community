"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Profile, Achievement } from "@/types/profile";
import { safeArray, normalizeProfile } from "@/lib/utils";
import { ensureArray } from "@/lib/data-sanitizer";

/** 取得した生データを正規化し、全ての配列プロパティを安全な配列に変換する（データ変換レイヤー） */
function sanitizeProfile(raw: Record<string, unknown> & { bench_press_max?: number } | unknown): Profile {
  const row = raw != null && Array.isArray(raw) ? (raw as unknown[])[0] : raw;
  const obj = row != null && typeof row === "object" && !Array.isArray(row) ? (row as Record<string, unknown>) : {};
  const normalized = normalizeProfile(obj) ?? obj;
  const toStrArr = (v: unknown): string[] =>
    ensureArray(v).map((x) => String(x));
  const toAchievements = (v: unknown): Achievement[] =>
    ensureArray(v).map((a) => {
      const o = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
      return {
        title: String(o.title ?? ""),
        year: Number(o.year) || 0,
        rank: String(o.rank ?? ""),
      };
    });

  return {
    ...normalized,
    name: (normalized.nickname ?? normalized.username ?? normalized.name) as string | null,
    bench_max: (normalized.bench_press_max ?? normalized.bench_max ?? 0) as number,
    squat_max: (normalized.squat_max as number) ?? 0,
    deadlift_max: (normalized.deadlift_max as number) ?? 0,
    achievements: toAchievements(normalized.achievements),
    certifications: toStrArr(normalized.certifications),
    email: (normalized.email as string) ?? null,
    header_url: (normalized.header_url as string | null) ?? null,
    followers_count: (normalized.followers_count as number) ?? 0,
    following_count: (normalized.following_count as number) ?? 0,
    collab_count: (normalized.collab_count as number) ?? 0,
    nickname: (normalized.nickname as string) ?? null,
    gender: (normalized.gender as string) ?? null,
    birthday: (normalized.birthday as string) ?? null,
    prefecture: (normalized.prefecture as string) ?? null,
    home_gym: (normalized.home_gym as string) ?? null,
    exercises: toStrArr(normalized.exercises).length > 0 ? toStrArr(normalized.exercises) : null,
    is_age_public: normalized.is_age_public !== false,
    is_prefecture_public: normalized.is_prefecture_public !== false,
    is_home_gym_public: normalized.is_home_gym_public !== false,
  } as Profile;
}

export function useProfileById(profileId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(!!profileId);

  const fetchProfile = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        console.error("[プロフィール] 他ユーザー取得失敗:", {
          profileId: id,
          reason: error ? error.message : "data is null",
          code: error?.code,
        });
        setProfile(null);
        return null;
      }
      const row = data as Record<string, unknown> & { bench_press_max?: number };
    let followers_count = 0;
    let following_count = 0;
    try {
      const sb = supabase as any;
      const [followersRes, followingRes] = await Promise.all([
        sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
        sb.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", id),
      ]);
      followers_count = (followersRes as { count?: number })?.count ?? 0;
      following_count = (followingRes as { count?: number })?.count ?? 0;
    } catch (e) {
      console.warn("[プロフィール] フォロワー数取得でエラー (続行):", e);
    }
    const withCounts = {
      ...row,
      followers_count: (row.followers_count as number) ?? followers_count,
      following_count: (row.following_count as number) ?? following_count,
    };
    try {
      const safeProfile = sanitizeProfile(withCounts);
      setProfile(safeProfile);
      return safeProfile;
    } catch (e) {
      console.error("[プロフィール] データ正規化でエラー:", e);
      if (e instanceof Error && e.stack) console.error("[プロフィール] スタック:", e.stack);
      setProfile(null);
      return null;
    }
    } catch (e) {
      console.error("[プロフィール] 取得で例外:", e);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchProfile(profileId).finally(() => setIsLoading(false));
  }, [profileId, fetchProfile]);

  return { profile, isLoading, refresh: () => profileId && fetchProfile(profileId) };
}
