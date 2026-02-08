"use client";

import { useProfile } from "@/hooks/use-profile";
import ProfileHeader from "@/components/profile/profile-header";
import StatsGrid from "@/components/profile/stats-grid";
import MyGears from "@/components/profile/my-gears";
import ActivityTimeline from "@/components/profile/activity-timeline";
import ProfileDetails from "@/components/profile/profile-details";
import { Loader2 } from "lucide-react";

const fallback = {
  name: "田中 太郎",
  bio: "IFBB Pro 目指し中",
  email: "taku@fitpeak.app",
  avatar_url: null as string | null,
  area: "東京・渋谷エリア",
  gym: "GOLD'S GYM 原宿",
  bench_max: 130,
  squat_max: 180,
  deadlift_max: 220,
  training_years: 8,
  goal: "BIG3合計600kgを目指す",
  achievements: [
    { title: "東京オープン", year: 2024, rank: "優勝" },
    { title: "FWJ JAPAN OPEN", year: 2023, rank: "3位" },
    { title: "関東クラシック", year: 2023, rank: "優勝" },
  ],
  certifications: ["NSCA-CPT", "JATI-ATI", "栄養士"],
  followers_count: 1248,
  following_count: 326,
  collab_count: 89,
};

export default function ProfilePage() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm font-semibold text-muted-foreground">
            読み込み中...
          </p>
        </div>
      </main>
    );
  }

  const p = profile ?? fallback;
  const benchMax =
    (profile as { bench_press_max?: number } | null)?.bench_press_max ??
    fallback.bench_max;
  const squatMax =
    (profile as { squat_max?: number } | null)?.squat_max ?? fallback.squat_max;
  const deadliftMax =
    (profile as { deadlift_max?: number } | null)?.deadlift_max ??
    fallback.deadlift_max;
  const safeAchievements = Array.isArray((p as { achievements?: unknown }).achievements)
    ? (p as { achievements: typeof fallback.achievements }).achievements
    : fallback.achievements;
  const safeCertifications = Array.isArray((p as { certifications?: unknown }).certifications)
    ? (p as { certifications: string[] }).certifications
    : fallback.certifications;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        <ProfileHeader
          name={p.name ?? "名前未設定"}
          bio={p.bio}
          avatarUrl={p.avatar_url}
          area={p.area}
          gym={p.gym}
          goal={p.goal}
          trainingYears={p.training_years ?? 0}
          followersCount={p.followers_count ?? 0}
          followingCount={p.following_count ?? 0}
          collabCount={p.collab_count ?? 0}
        />

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <StatsGrid
          benchMax={benchMax}
          squatMax={squatMax}
          deadliftMax={deadliftMax}
        />

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <ProfileDetails
          achievements={safeAchievements}
          certifications={safeCertifications}
          trainingYears={p.training_years ?? 0}
          goal={p.goal}
        />

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <MyGears />

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <ActivityTimeline />

        <div className="h-8" />
      </div>
    </main>
  );
}
