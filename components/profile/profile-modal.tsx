"use client";

import { useState } from "react";
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
import ProfileDetails from "@/components/profile/profile-details";
import ActivityTimeline from "@/components/profile/activity-timeline";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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

export default function ProfileModal({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { profile: myProfile } = useProfile();
  const { profile: displayProfile, isLoading, refresh: refreshProfile } = useProfileById(open ? userId : null);
  const profileUserId = displayProfile?.id ?? userId ?? null;
  const isOwnProfile = !!(myProfile?.id && myProfile.id === profileUserId);
  const { isFollowing, toggle: onFollow, loading: followLoading } = useFollow(
    profileUserId,
    myProfile?.id ?? null,
    { onSuccess: refreshProfile }
  );
  const { isBlocked, refetch: refetchBlock } = useBlockStatus(isOwnProfile ? null : profileUserId);
  const { blockedIds } = useBlockedUserIds();
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<FollowTab>("followers");

  const handleMessage = async () => {
    if (!myProfile?.id || !profileUserId || myProfile.id === profileUserId) return;
    try {
      const conversationId = await getOrCreateConversation(myProfile.id, profileUserId);
      onOpenChange(false);
      router.push(`/dashboard/messages/${conversationId}`);
    } catch (err) {
      console.error("getOrCreateConversation:", err);
    }
  };

  if (!userId) return null;

  const safeBlockedIds = blockedIds instanceof Set ? blockedIds : new Set<string>();
  const isBlockedUser = profileUserId ? safeBlockedIds.has(profileUserId) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[min(100vw-2rem,28rem)] overflow-hidden flex flex-col p-0 gap-0 border-border/60 bg-card"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="overflow-y-auto flex-1 min-h-0 pt-10 pr-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">読み込み中...</p>
            </div>
          ) : !displayProfile ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              ユーザーが見つかりません
            </div>
          ) : isBlockedUser ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              このユーザーは表示できません
            </div>
          ) : (
            (() => {
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
                <>
                  <div className="px-4 pt-4 pb-2 sm:px-6">
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
                  </div>
                  {profileUserId && (
                    <FollowListModal
                      open={followModalOpen}
                      onOpenChange={setFollowModalOpen}
                      profileUserId={profileUserId}
                      myUserId={myProfile?.id ?? null}
                      initialTab={followModalTab}
                      onFollowChange={refreshProfile}
                    />
                  )}
                  <div className="mx-4 h-px bg-border/40 sm:mx-6" />
                  <div className="px-4 py-3 sm:px-6">
                    <StatsGrid benchMax={benchMax} squatMax={squatMax} deadliftMax={deadliftMax} />
                  </div>
                  <div className="mx-4 h-px bg-border/40 sm:mx-6" />
                  <div className="px-4 py-3 sm:px-6">
                    <ProfileDetails
                      achievements={safeArray(safeAchievements) as Achievement[]}
                      certifications={safeArray(safeCertifications) as string[]}
                      trainingYears={(p as { training_years?: number }).training_years ?? 0}
                      goal={p.goal ?? null}
                    />
                  </div>
                  <div className="mx-4 h-px bg-border/40 sm:mx-6" />
                  <div className="px-4 py-3 sm:px-6">
                    <ActivityTimeline profileId={profileUserId ?? undefined} />
                  </div>
                  <div className="h-6" />
                </>
              );
            })()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
