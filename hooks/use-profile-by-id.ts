"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types/profile";

export function useProfileById(profileId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(!!profileId);

  const fetchProfile = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      setProfile(null);
      return null;
    }
    const sb = supabase as any;
    const [followersRes, followingRes] = await Promise.all([
      sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
      sb.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", id),
    ]);
    const followers_count = (followersRes as { count?: number }).count ?? 0;
    const following_count = (followingRes as { count?: number }).count ?? 0;
    const row = data as Record<string, unknown> & { bench_press_max?: number };
    const mapped: Profile = {
      ...row,
      name: (row.nickname ?? row.username ?? row.name) as string | null,
      bench_max: row.bench_press_max ?? row.bench_max ?? 0,
      squat_max: (row.squat_max as number) ?? 0,
      deadlift_max: (row.deadlift_max as number) ?? 0,
      achievements: Array.isArray(row.achievements) ? row.achievements : [],
      certifications: Array.isArray(row.certifications) ? row.certifications : [],
      email: (row.email as string) ?? null,
      followers_count: (row.followers_count as number) ?? followers_count,
      following_count: (row.following_count as number) ?? following_count,
      collab_count: (row.collab_count as number) ?? 0,
      nickname: (row.nickname as string) ?? null,
      gender: (row.gender as string) ?? null,
      birthday: (row.birthday as string) ?? null,
      prefecture: (row.prefecture as string) ?? null,
      home_gym: (row.home_gym as string) ?? null,
      exercises: Array.isArray(row.exercises) ? (row.exercises as string[]) : null,
      is_age_public: row.is_age_public !== false,
      is_prefecture_public: row.is_prefecture_public !== false,
      is_home_gym_public: row.is_home_gym_public !== false,
    } as Profile;
    setProfile(mapped);
    return mapped;
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
