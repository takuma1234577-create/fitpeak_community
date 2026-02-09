"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Profile, ProfileUpdate } from "@/types/profile";
import type { ProfilesUpdate } from "@/types/supabase";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[useProfile] Failed to fetch profile:", error.message);
        return null;
      }
      const row = data as Record<string, unknown> & { bench_press_max?: number };
      return {
        ...row,
        name: (row.nickname ?? row.username ?? row.name) as string | null,
        bench_max: row.bench_press_max ?? row.bench_max ?? 0,
        squat_max: (row.squat_max as number) ?? 0,
        deadlift_max: (row.deadlift_max as number) ?? 0,
        achievements: Array.isArray(row.achievements) ? row.achievements : [],
        certifications: Array.isArray(row.certifications) ? row.certifications : [],
        email: (row.email as string) ?? null,
        followers_count: (row.followers_count as number) ?? 0,
        following_count: (row.following_count as number) ?? 0,
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
    } catch (e) {
      console.error("[useProfile] Error:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const dbUpdates: ProfilesUpdate = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name !== undefined) dbUpdates.username = updates.name;
        if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
        if (updates.area !== undefined) dbUpdates.area = updates.area;
        if (updates.gym !== undefined) dbUpdates.gym = updates.gym;
        if (updates.training_years !== undefined) dbUpdates.training_years = updates.training_years;
        if (updates.goal !== undefined) dbUpdates.goal = updates.goal;
        if (updates.bench_max !== undefined) dbUpdates.bench_press_max = updates.bench_max;
        if (updates.squat_max !== undefined) dbUpdates.squat_max = updates.squat_max;
        if (updates.deadlift_max !== undefined) dbUpdates.deadlift_max = updates.deadlift_max;
        if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
        if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
        if (updates.prefecture !== undefined) dbUpdates.prefecture = updates.prefecture;
        if (updates.home_gym !== undefined) dbUpdates.home_gym = updates.home_gym;
        if (updates.exercises !== undefined) dbUpdates.exercises = updates.exercises;
        if (updates.is_age_public !== undefined) dbUpdates.is_age_public = updates.is_age_public;
        if (updates.is_prefecture_public !== undefined) dbUpdates.is_prefecture_public = updates.is_prefecture_public;
        if (updates.is_home_gym_public !== undefined) dbUpdates.is_home_gym_public = updates.is_home_gym_public;
        if ((updates as { instagram_id?: string }).instagram_id !== undefined) {
          dbUpdates.instagram_id = (updates as { instagram_id: string }).instagram_id;
        }
        if ((updates as { youtube_url?: string }).youtube_url !== undefined) {
          dbUpdates.youtube_url = (updates as { youtube_url: string }).youtube_url;
        }
        if ((updates as { twitter_url?: string }).twitter_url !== undefined) {
          dbUpdates.twitter_url = (updates as { twitter_url: string }).twitter_url;
        }
        if ((updates as { tiktok_url?: string }).tiktok_url !== undefined) {
          dbUpdates.tiktok_url = (updates as { tiktok_url: string }).tiktok_url;
        }
        if ((updates as { facebook_url?: string }).facebook_url !== undefined) {
          dbUpdates.facebook_url = (updates as { facebook_url: string }).facebook_url;
        }

        const { error } = await (supabase as any).from("profiles").update(dbUpdates).eq("id", user.id);

        if (error) throw error;
        const next = await fetchProfile();
        if (next) setProfile(next);
      } catch (e) {
        console.error("[useProfile] Update error:", e);
        throw e;
      }
    },
    [fetchProfile]
  );

  return {
    profile,
    isLoading,
    updateProfile,
    refreshProfile: () => fetchProfile().then(setProfile),
  };
}
