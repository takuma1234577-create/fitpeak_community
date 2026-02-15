"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Loader2,
  ArrowRight,
  UserPlus,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { isProfileCompleted } from "@/lib/profile-completed";
import { getRecommendedUsersForOnboarding, getRecommendedGroupsForOnboarding, getMyProfile } from "@/lib/recommendations";
import type { RecommendedUser } from "@/lib/recommendations";
import { useFollow } from "@/hooks/use-follow";
import { useProfileModal } from "@/contexts/profile-modal-context";
import { toGenderLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

function calcAge(birthday: string | null): number | null {
  if (!birthday?.trim()) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function RecommendedUserCard({
  user,
  myUserId,
  onOpenProfile,
}: {
  user: RecommendedUser;
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const { isFollowing, toggle, loading } = useFollow(user.id, myUserId);
  const name = user.nickname || user.username || "ユーザー";
  const initial = name.charAt(0);
  const showFollow = myUserId && myUserId !== user.id;
  const age = user.is_age_public && user.birthday ? calcAge(user.birthday) : null;
  const genderLabel = toGenderLabel(user.gender);
  const hasSubInfo = user.prefecture || age !== null || genderLabel;

  return (
    <div className="flex w-[160px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border/40 bg-card px-4 py-4 transition-all hover:border-gold/30 hover:bg-card/80">
      <button
        type="button"
        onClick={() => onOpenProfile(user.id)}
        className="flex w-full flex-col items-center gap-2"
      >
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border/60">
          <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-secondary text-sm font-bold">{initial}</AvatarFallback>
        </Avatar>
        <p className="w-full truncate text-center text-sm font-bold text-foreground">{name}</p>
        {hasSubInfo && (
          <div className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {user.prefecture && <span className="truncate">{user.prefecture}</span>}
            {age !== null && <span>{age}歳</span>}
            {genderLabel && <span>{genderLabel}</span>}
          </div>
        )}
      </button>
      {showFollow && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle();
          }}
          disabled={loading}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all disabled:opacity-60",
            isFollowing
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-border bg-secondary text-foreground hover:border-gold/30"
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {isFollowing ? "フォロー中" : "フォロー"}
        </button>
      )}
    </div>
  );
}

function OfficialGroupCard({
  group,
  myUserId,
  isJoined,
  onJoin,
  joining,
}: {
  group: { id: string; name: string; description: string | null; chat_room_id: string | null };
  myUserId: string | null;
  isJoined: boolean;
  onJoin: (groupId: string) => void;
  joining: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold/30 bg-card/80 px-5 py-4 transition-all hover:border-gold/50">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15">
          <Shield className="h-6 w-6 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-foreground">
              公式
            </span>
            <h3 className="font-bold text-foreground">{group.name}</h3>
          </div>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{group.description}</p>
          )}
        </div>
      </div>
      {myUserId && (
        isJoined ? (
          group.chat_room_id ? (
            <Link
              href={`/dashboard/messages/${group.chat_room_id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/20"
            >
              グループチャットへ
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/groups/${group.id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/20"
            >
              グループを見る
              <ChevronRight className="h-4 w-4" />
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={() => onJoin(group.id)}
            disabled={joining}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold bg-gold py-2.5 text-sm font-bold text-[#050505] transition-colors hover:bg-gold-light disabled:opacity-60"
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Shield className="h-4 w-4" />
                グループに参加
              </>
            )}
          </button>
        )
      )}
    </div>
  );
}

export default function OnboardingRecommendationsPage() {
  const router = useRouter();
  const { openProfileModal } = useProfileModal();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<RecommendedUser[]>([]);
  const [officialGroups, setOfficialGroups] = useState<{
    id: string;
    name: string;
    description: string | null;
    chat_room_id: string | null;
  }[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myPrefecture, setMyPrefecture] = useState<string | null>(null);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());

  const onOpenProfile = useCallback(
    (userId: string) => {
      if (openProfileModal) openProfileModal(userId);
      else router.push(`/profile/${userId}`);
    },
    [openProfileModal, router]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) router.replace("/");
        return;
      }

      const profileRow = await supabase
        .from("profiles")
        .select("avatar_url, nickname, username, bio, prefecture, exercises")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled && profileRow.data) {
        const row = profileRow.data as {
          avatar_url: string | null;
          nickname: string | null;
          username: string | null;
          bio: string | null;
          prefecture: string | null;
          exercises: string[] | null;
        };
        if (!isProfileCompleted(row)) {
          router.replace("/onboarding");
          return;
        }
      }

      setMyUserId(user.id);
      const myProfile = await getMyProfile(supabase, user.id);
      const pref = myProfile?.prefecture?.trim() ?? (profileRow.data as unknown as { prefecture?: string | null } | null)?.prefecture?.trim() ?? null;
      setMyPrefecture(pref);

      const [recUsers, allGroups] = await Promise.all([
        getRecommendedUsersForOnboarding(supabase, myProfile, user.id, 5),
        getRecommendedGroupsForOnboarding(supabase, myProfile, pref),
      ]);

      if (!cancelled) {
        setUsers(recUsers);
        setOfficialGroups(allGroups);

        if (allGroups.length > 0) {
          const { data: members } = await supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", user.id)
            .in("group_id", allGroups.map((g) => g.id));
          const memberList = (members ?? []) as { group_id: string }[];
          const joined = new Set(memberList.map((m) => m.group_id));
          setJoinedGroupIds(joined);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleJoinGroup = async (groupId: string) => {
    if (!myUserId) return;
    const group = officialGroups.find((g) => g.id === groupId);
    if (!group) return;
    setJoiningGroupId(groupId);
    try {
      const supabase = createClient();
      const sb = supabase as any;
      await sb.from("group_members").insert({ group_id: groupId, user_id: myUserId });
      if (group.chat_room_id) {
        await sb.from("conversation_participants").insert({
          conversation_id: group.chat_room_id,
          user_id: myUserId,
        });
      }
      setJoinedGroupIds((prev) => new Set(prev).add(groupId));
    } catch (e) {
      console.error(e);
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleSkip = () => {
    router.replace("/dashboard");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm font-semibold text-muted-foreground">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 pb-24">
      <div className="mx-auto max-w-[500px]">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-9 w-9 text-gold" strokeWidth={2.5} />
            <h1 className="text-3xl font-black tracking-[0.2em] text-gold">FITPEAK</h1>
          </div>
          <p className="text-center text-sm font-semibold text-muted-foreground">
            仲間を見つけよう
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {myPrefecture
              ? `${myPrefecture}の仲間や公式グループをおすすめしています`
              : "おすすめのユーザーをフォローして仲間を増やしましょう"}
          </p>
        </div>

        {/* おすすめユーザー */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <h2 className="text-base font-bold text-foreground">おすすめユーザー</h2>
          </div>
          {users.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                同じ地域のユーザーはいません。検索で仲間を探してみましょう。
              </p>
              <Link
                href="/dashboard/search"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold"
              >
                検索で仲間を探す
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {users.map((user) => (
                <RecommendedUserCard
                  key={user.id}
                  user={user}
                  myUserId={myUserId}
                  onOpenProfile={onOpenProfile}
                />
              ))}
            </div>
          )}
        </section>

        {/* おすすめグループ（トレーニーの集まり場 + 地域の公式） */}
        {officialGroups.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              <h2 className="text-base font-bold text-foreground">おすすめグループ</h2>
            </div>
            <div className="flex flex-col gap-4">
              {officialGroups.map((group) => (
                <OfficialGroupCard
                  key={group.id}
                  group={group}
                  myUserId={myUserId}
                  isJoined={joinedGroupIds.has(group.id)}
                  onJoin={handleJoinGroup}
                  joining={joiningGroupId === group.id}
                />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4 pt-4">
          <button
            type="button"
            onClick={handleSkip}
            className="w-full rounded-lg border border-border py-3.5 text-sm font-bold text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            スキップしてダッシュボードへ
          </button>
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-4 text-sm font-black uppercase tracking-[0.15em] text-[#050505] transition-all hover:bg-gold-light active:scale-[0.98]"
          >
            ダッシュボードへ進む
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
