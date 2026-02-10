"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useProfileById } from "@/hooks/use-profile-by-id";
import { useFollow } from "@/hooks/use-follow";
import { useBlockStatus } from "@/hooks/use-block-status";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { getOrCreateConversation } from "@/lib/conversations";
import ProfileHeader from "@/components/profile/profile-header";
import FollowListModal from "@/components/profile/follow-list-modal";
import type { FollowTab } from "@/components/profile/follow-list-modal";
import StatsGrid from "@/components/profile/stats-grid";
import ActivityTimeline from "@/components/profile/activity-timeline";
import ProfileDetails from "@/components/profile/profile-details";
import OtherProfileTop from "@/components/profile/other-profile-top";
import { Loader2 } from "lucide-react";
import { safeArray } from "@/lib/utils";
import type { Achievement } from "@/types/profile";

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

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const u = searchParams.get("u");
  const router = useRouter();
  const { profile: myProfile, isLoading: myLoading, refreshProfile } = useProfile();
  const { profile: otherProfile, isLoading: otherLoading, refresh: refreshOtherProfile } = useProfileById(u || null);
  const displayProfile = u ? otherProfile : myProfile;
  const isLoading = u ? (myLoading || otherLoading) : myLoading;
  const isOwnProfile = !u || (myProfile?.id === u);
  const profileUserId = displayProfile?.id ?? u ?? null;
  const refreshDisplayProfile = u ? refreshOtherProfile : refreshProfile;
  const { isFollowing, toggle: onFollow, loading: followLoading } = useFollow(profileUserId, myProfile?.id ?? null, {
    onSuccess: refreshDisplayProfile,
  });
  const { isBlocked, refetch: refetchBlock } = useBlockStatus(isOwnProfile ? null : profileUserId);
  const { blockedIds } = useBlockedUserIds();
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<FollowTab>("followers");

  const handleMessage = async () => {
    if (!myProfile?.id || !profileUserId || myProfile.id === profileUserId) return;
    try {
      const conversationId = await getOrCreateConversation(myProfile.id, profileUserId);
      router.push(`/dashboard/messages/${conversationId}`);
    } catch (err) {
      console.error("getOrCreateConversation:", err);
    }
  };

  // ---------- 他ユーザープロフィール（?u=xxx）：上部分のみ ----------
  if (u) {
    if (isLoading) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-sm font-semibold text-muted-foreground">読み込み中...</p>
          </div>
        </main>
      );
    }
    if (!otherProfile) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div className="rounded-xl border border-border/40 bg-card/50 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">ユーザーが見つかりません</p>
          </div>
        </main>
      );
    }
    const safeBlockedIds = blockedIds instanceof Set ? blockedIds : new Set<string>();
    if (profileUserId && safeBlockedIds.has(profileUserId)) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">このユーザーは表示できません</p>
        </main>
      );
    }
    const name =
      ((otherProfile as { nickname?: string | null }).nickname ||
        (otherProfile as { username?: string | null }).username ||
        (otherProfile as { name?: string | null }).name) ??
      "名前未設定";
    const followersCount = (otherProfile as { followers_count?: number }).followers_count ?? 0;
    const followingCount = (otherProfile as { following_count?: number }).following_count ?? 0;
    const collabCount = (otherProfile as { collab_count?: number }).collab_count ?? 0;
    const isPrefecturePublic = (otherProfile as { is_prefecture_public?: boolean }).is_prefecture_public !== false;
    const isHomeGymPublic = (otherProfile as { is_home_gym_public?: boolean }).is_home_gym_public !== false;
    const isAgePublic = (otherProfile as { is_age_public?: boolean }).is_age_public !== false;
    const prefecture = (otherProfile as { prefecture?: string | null }).prefecture ?? (otherProfile as { area?: string | null }).area;
    const homeGym = (otherProfile as { home_gym?: string | null }).home_gym ?? (otherProfile as { gym?: string | null }).gym;
    const birthday = (otherProfile as { birthday?: string | null }).birthday ?? null;
    const ageNum = calcAge(birthday);
    const ageDisplay = birthday ? (isAgePublic && ageNum !== null ? `${ageNum}歳` : "非公開") : null;
    const displayArea =
      prefecture || (otherProfile as { area?: string | null }).area
        ? isPrefecturePublic
          ? prefecture || (otherProfile as { area?: string | null }).area
          : "非公開"
        : null;
    const displayGym =
      homeGym || (otherProfile as { gym?: string | null }).gym
        ? isHomeGymPublic
          ? homeGym || (otherProfile as { gym?: string | null }).gym
          : "非公開"
        : null;
    const benchMax = (otherProfile as { bench_max?: number }).bench_max ?? (otherProfile as { bench_press_max?: number }).bench_press_max ?? 0;
    const squatMax = (otherProfile as { squat_max?: number }).squat_max ?? 0;
    const deadliftMax = (otherProfile as { deadlift_max?: number }).deadlift_max ?? 0;
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg">
          <OtherProfileTop
            headerUrl={(otherProfile as { header_url?: string | null }).header_url ?? null}
            avatarUrl={otherProfile.avatar_url ?? null}
            name={name}
            onBack={() => router.push("/dashboard")}
            bio={otherProfile.bio ?? null}
            goal={(otherProfile as { goal?: string | null }).goal ?? null}
            ageDisplay={ageDisplay}
            gender={(otherProfile as { gender?: string | null }).gender ?? null}
            gym={displayGym}
            trainingYears={(otherProfile as { training_years?: number }).training_years ?? 0}
            area={displayArea}
            followersCount={followersCount}
            followingCount={followingCount}
            collabCount={collabCount}
            isFollowing={isFollowing}
            onFollow={onFollow}
            followLoading={followLoading}
            isOwnProfile={false}
            onMessage={handleMessage}
            onFollowersClick={() => { setFollowModalTab("followers"); setFollowModalOpen(true); }}
            onFollowingClick={() => { setFollowModalTab("following"); setFollowModalOpen(true); }}
          />
          {profileUserId && (
            <FollowListModal
              open={followModalOpen}
              onOpenChange={setFollowModalOpen}
              profileUserId={profileUserId}
              myUserId={myProfile?.id ?? null}
              initialTab={followModalTab}
              onFollowChange={refreshOtherProfile}
            />
          )}
          <div className="mx-5 h-px bg-border/40 sm:mx-8" />
          <StatsGrid benchMax={benchMax} squatMax={squatMax} deadliftMax={deadliftMax} />
        </div>
      </main>
    );
  }

  // ---------- 自分のプロフィール：従来どおりフル表示 ----------
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm font-semibold text-muted-foreground">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!displayProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-lg rounded-xl border border-border/40 bg-card/50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">プロフィールがありません</p>
          <p className="mt-2 text-xs text-muted-foreground/80">設定からプロフィールを登録してください</p>
          <a
            href="/dashboard/settings"
            className="mt-4 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-[#050505] transition-colors hover:bg-gold-light"
          >
            設定へ
          </a>
        </div>
      </main>
    );
  }

  const p = displayProfile;
  const benchMax = (p as { bench_press_max?: number }).bench_press_max ?? 0;
  const squatMax = (p as { squat_max?: number }).squat_max ?? 0;
  const deadliftMax = (p as { deadlift_max?: number }).deadlift_max ?? 0;
  const safeAchievements = safeArray(((p as { achievements?: unknown }).achievements) as unknown[] | null | undefined);
  const safeCertifications = safeArray(((p as { certifications?: unknown }).certifications) as unknown[] | null | undefined);
  const isPrefecturePublic = (p as { is_prefecture_public?: boolean }).is_prefecture_public !== false;
  const isHomeGymPublic = (p as { is_home_gym_public?: boolean }).is_home_gym_public !== false;
  const isAgePublic = (p as { is_age_public?: boolean }).is_age_public !== false;
  const prefecture = (p as { prefecture?: string | null }).prefecture ?? (p as { area?: string | null }).area;
  const homeGym = (p as { home_gym?: string | null }).home_gym ?? (p as { gym?: string | null }).gym;
  const birthday = (p as { birthday?: string | null }).birthday ?? null;
  const displayArea =
    prefecture || (p as { area?: string | null }).area
      ? isPrefecturePublic
        ? prefecture || (p as { area?: string | null }).area
        : "非公開"
      : null;
  const displayGym =
    homeGym || (p as { gym?: string | null }).gym
      ? isHomeGymPublic
        ? homeGym || (p as { gym?: string | null }).gym
        : "非公開"
      : null;
  const ageNum = calcAge(birthday);
  const ageDisplay = birthday ? (isAgePublic && ageNum !== null ? `${ageNum}歳` : "非公開") : null;
  const name =
    ((p as { nickname?: string | null }).nickname ||
      (p as { username?: string | null }).username ||
      (p as { name?: string | null }).name) ??
    "名前未設定";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        <ProfileHeader
          name={name}
          bio={p.bio ?? null}
          avatarUrl={p.avatar_url ?? null}
          headerUrl={(p as { header_url?: string | null }).header_url ?? null}
          avatarUpdatedAt={(p as { updated_at?: string }).updated_at ?? null}
          area={displayArea ?? null}
          gym={displayGym ?? null}
          ageDisplay={ageDisplay ?? null}
          goal={p.goal ?? null}
          trainingYears={(p as { training_years?: number }).training_years ?? 0}
          followersCount={(p as { followers_count?: number }).followers_count ?? 0}
          followingCount={(p as { following_count?: number }).following_count ?? 0}
          collabCount={(p as { collab_count?: number }).collab_count ?? 0}
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
          isBlocked={isBlocked}
          onBlockChange={refetchBlock}
          onFollowersClick={profileUserId ? () => { setFollowModalTab("followers"); setFollowModalOpen(true); } : undefined}
          onFollowingClick={profileUserId ? () => { setFollowModalTab("following"); setFollowModalOpen(true); } : undefined}
        />
        {profileUserId && (
          <FollowListModal
            open={followModalOpen}
            onOpenChange={setFollowModalOpen}
            profileUserId={profileUserId}
            myUserId={myProfile?.id ?? null}
            initialTab={followModalTab}
            onFollowChange={refreshDisplayProfile}
          />
        )}

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <StatsGrid benchMax={benchMax} squatMax={squatMax} deadliftMax={deadliftMax} />

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <ProfileDetails
          achievements={safeArray(safeAchievements) as Achievement[]}
          certifications={safeArray(safeCertifications) as string[]}
          trainingYears={(p as { training_years?: number }).training_years ?? 0}
          goal={p.goal ?? null}
        />

        <div className="mx-5 h-px bg-border/40 sm:mx-8" />

        <ActivityTimeline profileId={profileUserId ?? undefined} />

        <div className="h-8" />
      </div>
    </main>
  );
}
