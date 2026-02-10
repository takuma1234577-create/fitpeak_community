"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Flame,
  Shield,
  Clock,
  MessageCircle,
  Dumbbell,
  Users,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { safeArray, safeList } from "@/lib/utils";
import type { RecommendedUser, NewArrivalUser } from "@/lib/recommendations";
import { useFollow } from "@/hooks/use-follow";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { useProfileModal } from "@/contexts/profile-modal-context";

const todayMotivation = {
  greeting: "おかえりなさい。",
  date: new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }),
  message: "今日は胸の日です。限界を超えろ。",
};

function SectionHeader({
  icon: Icon,
  title,
  href,
  linkLabel,
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-extrabold tracking-wide text-foreground">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-gold"
        >
          {linkLabel || "もっと見る"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/40">
      <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="relative flex flex-col gap-4 px-6 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground" suppressHydrationWarning>
          {todayMotivation.date}
        </p>
        <h1 className="text-balance text-2xl font-black leading-tight text-foreground sm:text-3xl">
          {todayMotivation.greeting}
        </h1>
        <p className="text-sm font-bold text-foreground sm:text-base">
          {todayMotivation.message}
        </p>
      </div>
    </section>
  );
}

function MyScheduleSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader icon={Clock} title="参加予定" href="/dashboard/recruit" linkLabel="募集を探す" />
      <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-8 text-center">
        <Clock className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          参加予定の募集はありません
        </p>
        <Link
          href="/dashboard/recruit"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:text-gold-light"
        >
          合トレ募集を探す
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function formatRegisteredAt(createdAt: string): string {
  if (!createdAt) return "登録日不明";
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "今日登録";
  if (diffDays === 1) return "1日前に登録";
  if (diffDays < 7) return `${diffDays}日前に登録`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前に登録`;
  return `${Math.floor(diffDays / 30)}ヶ月前に登録`;
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

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all hover:border-gold/30 hover:bg-card/80">
      <button
        type="button"
        onClick={() => onOpenProfile(user.id)}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <Avatar className="h-12 w-12 shrink-0 ring-1 ring-border/60">
          <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-secondary text-sm font-bold">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{name}</p>
          {user.bio && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{user.bio}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80">
            {user.prefecture && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gold/70" />
                {user.prefecture}
              </span>
            )}
            {user.home_gym && <span className="truncate">{user.home_gym}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </button>
      {showFollow && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle();
          }}
          disabled={loading}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 ${
            isFollowing
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-border bg-secondary text-foreground hover:border-gold/30"
          }`}
        >
          {isFollowing ? "フォロー中" : "フォローする"}
        </button>
      )}
    </div>
  );
}

function RecommendedUsersSection({
  users,
  myUserId,
  onOpenProfile,
}: {
  users: RecommendedUser[] | null | undefined;
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const safeUsers = safeArray(users);
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={Users}
        title="おすすめのユーザー (Recommended Users)"
        href="/dashboard/search"
        linkLabel="検索で仲間を探す"
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {safeUsers.map((user) => (
          <RecommendedUserCard key={user.id} user={user} myUserId={myUserId} onOpenProfile={onOpenProfile} />
        ))}
      </div>
    </section>
  );
}

function NewArrivalUserCard({
  user,
  myUserId,
  onOpenProfile,
}: {
  user: NewArrivalUser;
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const { isFollowing, toggle, loading } = useFollow(user.id, myUserId);
  const name = user.nickname || user.username || "ユーザー";
  const initial = name.charAt(0);
  const showFollow = myUserId && myUserId !== user.id;

  return (
    <div className="flex w-[160px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border/40 bg-card px-4 py-4 transition-all hover:border-gold/30 hover:bg-card/80">
      <button
        type="button"
        onClick={() => onOpenProfile(user.id)}
        className="flex flex-col items-center gap-2 w-full"
      >
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border/60">
          <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-secondary text-sm font-bold">{initial}</AvatarFallback>
        </Avatar>
        <p className="w-full truncate text-center text-sm font-bold text-foreground">{name}</p>
        <span className="text-[11px] text-muted-foreground">
          {formatRegisteredAt(user.created_at)}
        </span>
      </button>
      {showFollow && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle();
          }}
          disabled={loading}
          className={`w-full rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all disabled:opacity-60 ${
            isFollowing
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-border bg-secondary text-foreground hover:border-gold/30"
          }`}
        >
          {isFollowing ? "フォロー中" : "フォローする"}
        </button>
      )}
    </div>
  );
}

function NewArrivalUsersSection({
  users,
  myUserId,
  onOpenProfile,
}: {
  users: NewArrivalUser[] | null | undefined;
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const safeUsers = safeArray(users);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-wide text-foreground">
            新規ユーザー (New Arrivals)
          </h2>
        </div>
        {safeUsers.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
              aria-label="前へスクロール"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
              aria-label="次へスクロール"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href="/dashboard/search"
              className="ml-2 flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-gold"
            >
              検索で仲間を探す
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
      {safeUsers.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">まだ新規ユーザーはいません</p>
      ) : (
        <div
          ref={scrollRef}
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 lg:-mx-0 lg:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {safeUsers.map((user) => (
            <NewArrivalUserCard key={user.id} user={user} myUserId={myUserId} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      )}
    </section>
  );
}

function YourGroupsSection() {
  const [groups, setGroups] = useState<{ id: string; name: string; unread: number; chat_room_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: members, error: memErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      const membersList = safeList(members as { group_id: string }[] | null);
      if (memErr || !membersList.length) {
        if (!cancelled) {
          setGroups([]);
          setLoading(false);
        }
        return;
      }
      const ids = membersList.map((m) => m.group_id);
      const { data: groupList, error } = await supabase
        .from("groups")
        .select("id, name, chat_room_id")
        .in("id", ids);
      const groupListTyped = safeList(groupList as { id: string; name: string; chat_room_id: string | null }[] | null);
      if (!cancelled) {
        if (error) {
          console.error("groups fetch:", error);
          setGroups([]);
        } else {
          setGroups(
            groupListTyped.map((g) => ({
              id: g.id,
              name: g.name,
              unread: 0,
              chat_room_id: g.chat_room_id ?? null,
            }))
          );
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader icon={Shield} title="所属グループの更新" href="/dashboard/groups" linkLabel="すべて見る" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={Shield}
        title="所属グループの更新"
        href="/dashboard/groups"
        linkLabel="すべて見る"
      />
      {groups.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            所属しているグループはありません
          </p>
          <Link
            href="/dashboard/groups"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/40 px-4 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:border-gold/30 hover:text-gold"
          >
            <Flame className="h-4 w-4" />
            グループを探す
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {safeArray(groups).map((group) => (
              <Link
                key={group.id}
                href={group.chat_room_id ? `/dashboard/messages/${group.chat_room_id}` : `/dashboard/groups/${group.id}`}
                className="flex items-center gap-4 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all duration-200 hover:border-gold/30 hover:bg-card/80"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60 bg-secondary">
                  <Image
                    src="/placeholder.svg"
                    alt={group.name}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span className="truncate text-sm font-bold text-foreground">
                    {group.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {group.unread > 0 ? (
                      <span className="flex items-center gap-1 text-foreground">
                        <MessageCircle className="h-3 w-3" />
                        {group.unread}件の新着
                      </span>
                    ) : (
                      "新着なし"
                    )}
                  </span>
                </div>
                {group.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-[#050505]">
                    {group.unread}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/groups"
            className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-secondary/40 py-3.5 text-sm font-bold text-muted-foreground transition-all duration-200 hover:border-gold/30 hover:text-gold"
          >
            <Flame className="h-4 w-4" />
            他のグループを探す
          </Link>
        </>
      )}
    </section>
  );
}

type HomePageProps = {
  recommendedUsers: RecommendedUser[];
  newArrivalUsers: NewArrivalUser[];
  myUserId: string | null;
};

export default function HomePage({
  recommendedUsers,
  newArrivalUsers,
  myUserId,
}: HomePageProps) {
  const { blockedIds } = useBlockedUserIds();
  const { openProfileModal } = useProfileModal();
  const filteredRecommendedUsers = recommendedUsers.filter((u) => !blockedIds.has(u.id));
  const filteredNewArrivalUsers = newArrivalUsers.filter((u) => !blockedIds.has(u.id));

  return (
    <div className="flex flex-col gap-8">
      <HeroSection />
      <MyScheduleSection />
      <RecommendedUsersSection users={filteredRecommendedUsers} myUserId={myUserId} onOpenProfile={openProfileModal} />
      <NewArrivalUsersSection users={filteredNewArrivalUsers} myUserId={myUserId} onOpenProfile={openProfileModal} />
      <YourGroupsSection />
    </div>
  );
}
