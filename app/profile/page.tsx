"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useProfileById } from "@/hooks/use-profile-by-id";
import { useFollow } from "@/hooks/use-follow";
import { getOrCreateConversation } from "@/lib/conversations";
import ProfileHeader from "@/components/profile/profile-header";
import StatsGrid from "@/components/profile/stats-grid";
import MyGears from "@/components/profile/my-gears";
import ActivityTimeline from "@/components/profile/activity-timeline";
import ProfileDetails from "@/components/profile/profile-details";
import { Loader2 } from "lucide-react";

function calcAge(birthday: string | null): number | null {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

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
  const searchParams = useSearchParams();
  const u = searchParams.get("u");
  const { profile: myProfile, isLoading: myLoading } = useProfile();
  const { profile: otherProfile, isLoading: otherLoading } = useProfileById(u || null);
  const displayProfile = u ? otherProfile : myProfile;
  const isLoading = u ? (myLoading || otherLoading) : myLoading;
  const isOwnProfile = !u || (myProfile?.id === u);
  const profileUserId = displayProfile?.id ?? u ?? null;
  const { isFollowing, toggle: onFollow, loading: followLoading } = useFollow(profileUserId, myProfile?.id ?? null);
  const router = useRouter();

  const handleMessage = async () => {
    if (!myProfile?.id || !profileUserId || myProfile.id === profileUserId) return;
    try {
      const conversationId = await getOrCreateConversation(myProfile.id, profileUserId);
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error("getOrCreateConversation:", err);
    }
  };

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

  if (u && !otherProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">ユーザーが見つかりません</p>
      </main>
    );
  }

  const p = displayProfile ?? fallback;
  const benchMax =
    (displayProfile as { bench_press_max?: number } | null)?.bench_press_max ??
    fallback.bench_max;
  const squatMax =
    (displayProfile as { squat_max?: number } | null)?.squat_max ?? fallback.squat_max;
  const deadliftMax =
    (displayProfile as { deadlift_max?: number } | null)?.deadlift_max ??
    fallback.deadlift_max;
  const safeAchievements = Array.isArray((p as { achievements?: unknown }).achievements)
    ? (p as { achievements: typeof fallback.achievements }).achievements
    : fallback.achievements;
  const safeCertifications = Array.isArray((p as { certifications?: unknown }).certifications)
    ? (p as { certifications: string[] }).certifications
    : fallback.certifications;

  const isPrefecturePublic = (p as { is_prefecture_public?: boolean }).is_prefecture_public !== false;
  const isHomeGymPublic = (p as { is_home_gym_public?: boolean }).is_home_gym_public !== false;
  const isAgePublic = (p as { is_age_public?: boolean }).is_age_public !== false;
  const prefecture = (p as { prefecture?: string | null }).prefecture ?? p.area;
  const homeGym = (p as { home_gym?: string | null }).home_gym ?? p.gym;
  const birthday = (p as { birthday?: string | null }).birthday ?? null;

  const displayArea = prefecture || p.area ? (isPrefecturePublic ? (prefecture || p.area) : "非公開") : null;
  const displayGym = homeGym || p.gym ? (isHomeGymPublic ? (homeGym || p.gym) : "非公開") : null;
  const ageNum = calcAge(birthday);
  const ageDisplay = birthday ? (isAgePublic && ageNum !== null ? `${ageNum}歳` : "非公開") : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        <ProfileHeader
          name={p.name ?? "名前未設定"}
          bio={p.bio}
          avatarUrl={p.avatar_url}
          avatarUpdatedAt={(p as { updated_at?: string }).updated_at}
          area={displayArea}
          gym={displayGym}
          ageDisplay={ageDisplay}
          goal={p.goal}
          trainingYears={p.training_years ?? 0}
          followersCount={p.followers_count ?? 0}
          followingCount={p.following_count ?? 0}
          collabCount={p.collab_count ?? 0}
          snsLinks={{
            instagram_id: (p as { instagram_id?: string | null }).instagram_id,
            youtube_url: (p as { youtube_url?: string | null }).youtube_url,
            twitter_url: (p as { twitter_url?: string | null }).twitter_url,
            tiktok_url: (p as { tiktok_url?: string | null }).tiktok_url,
            facebook_url: (p as { facebook_url?: string | null }).facebook_url,
          }}
          isOwnProfile={isOwnProfile}
          profileUserId={profileUserId ?? undefined}
          isFollowing={isFollowing}
          onFollow={onFollow}
          followLoading={followLoading}
          onMessage={handleMessage}
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

        <ActivityTimeline profileId={profileUserId ?? undefined} />

        <div className="h-8" />
      </div>
    </main>
  );
}
