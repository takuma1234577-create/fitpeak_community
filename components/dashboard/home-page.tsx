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
import type { NewArrivalUser } from "@/lib/recommendations";
import { useFollow } from "@/hooks/use-follow";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { useProfileModal } from "@/contexts/profile-modal-context";
import { toGenderLabel } from "@/lib/constants";
import JapanMapSection from "@/components/dashboard/japan-map-section";

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

type RecruitmentItem = {
  id: string;
  title: string;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  created_at: string;
  max_participants?: number | null;
  approvedCount?: number;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
};

function formatRecruitDate(eventDate: string): string {
  const d = new Date(eventDate);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[d.getDay()];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const time = d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${m}/${day} (${w}) ${time}`;
}

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

type RecommendedUserCardProps = {
  user: NewArrivalUser;
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
};

function RecommendedUserCard({ user, myUserId, onOpenProfile }: RecommendedUserCardProps) {
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

function RecommendedUsersSection({
  users,
  myUserId,
  onOpenProfile,
}: {
  users: NewArrivalUser[];
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const safeUsers = safeArray(users);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <section className="flex min-h-[120px] w-full min-w-0 flex-col gap-4" aria-label="おすすめユーザー">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Users className="h-5 w-5 shrink-0 text-gold" />
          <h2 className="text-lg font-extrabold tracking-wide text-foreground truncate">
            おすすめユーザー
          </h2>
        </div>
        {safeUsers.length > 0 && (
          <div className="flex shrink-0 items-center gap-1">
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
              className="ml-2 flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-gold whitespace-nowrap"
            >
              検索で仲間を探す
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        )}
      </div>
      {safeUsers.length === 0 ? (
        <div className="flex min-h-[100px] w-full items-center justify-center rounded-xl border border-border/40 bg-card/50 px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">まだおすすめユーザーはいません。検索で仲間を探してみましょう。</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="w-full min-w-0 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 lg:-mx-0 lg:px-0 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {safeUsers.map((user) => (
            <RecommendedUserCard key={user.id} user={user} myUserId={myUserId} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendedRecruitmentsSection() {
  const [list, setList] = useState<RecruitmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      let { data, error } = await (supabase as any)
        .from("recruitments")
        .select("id, title, target_body_part, event_date, location, created_at, max_participants, profiles(nickname, username, avatar_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error && (error.message?.includes("max_participants") || error.message?.includes("column"))) {
        const res = await (supabase as any)
          .from("recruitments")
          .select("id, title, target_body_part, event_date, location, created_at, profiles(nickname, username, avatar_url)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(10);
        data = res.data;
        error = res.error;
      }
      if (!cancelled && error) {
        console.error("recruitments fetch:", error);
        setList([]);
        setLoading(false);
        return;
      }
      const rows = safeList((data ?? []) as RecruitmentItem[]);
      const ids = rows.map((r) => r.id);
      const approvedByRec: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: partData } = await (supabase as any)
          .from("recruitment_participants")
          .select("recruitment_id")
          .in("recruitment_id", ids)
          .eq("status", "approved");
        const partList = safeList(partData as { recruitment_id: string }[] | null);
        for (const p of partList) {
          approvedByRec[p.recruitment_id] = (approvedByRec[p.recruitment_id] ?? 0) + 1;
        }
      }
      if (!cancelled) {
        setList(
          rows.map((r) => ({
            ...r,
            approvedCount: approvedByRec[r.id] ?? 0,
          }))
        );
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <Flame className="h-4 w-4 text-gold" />
            </div>
            <h2 className="text-base font-bold text-foreground">おすすめ合トレ</h2>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {/* V0風セクションヘッダー（ゴールドで統一） */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <Flame className="h-4 w-4 text-gold" />
          </div>
          <h2 className="text-base font-bold text-foreground">おすすめ合トレ</h2>
        </div>
        <Link
          href="/dashboard/recruit"
          className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          すべて見る
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-8 text-center shadow-sm">
          <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-semibold text-muted-foreground">募集中の合トレはありません</p>
          <Link
            href="/dashboard/recruit"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:text-gold"
          >
            合トレ募集を探す
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="scrollbar-hide -mx-4 snap-x snap-mandatory overflow-x-auto overflow-y-hidden px-4 pb-2">
          <div className="flex gap-3">
            {list.map((r) => {
              const organizer = r.profiles?.nickname || r.profiles?.username || "ユーザー";
              const organizerInitial = organizer.charAt(0);
              const avatarUrl = r.profiles?.avatar_url ?? null;
              const dateStr = r.event_date ? formatRecruitDate(r.event_date) : "—";
              const approvedCount = r.approvedCount ?? 0;
              const maxDisplay = r.max_participants != null ? String(r.max_participants) : "制限なし";
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/recruit?r=${r.id}`}
                  className="group relative w-full min-w-[85%] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl bg-card text-left shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                >
                  {/* 上部アクセントバー（サイトのゴールド） */}
                  <div className="h-1 w-full bg-gradient-to-r from-gold to-gold-light" />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {r.target_body_part && (
                          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
                            {r.target_body_part}
                          </span>
                        )}
                        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-card-foreground">
                          {r.title}
                        </h3>
                      </div>
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:bg-gold/10 group-hover:text-gold">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          <CalendarDays className="h-3.5 w-3.5 text-gold" />
                        </div>
                        <span className="font-medium">{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                        </div>
                        <span className="font-medium">{r.location || "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border/60">
                          <AvatarImage src={avatarUrl ?? undefined} alt={organizer} />
                          <AvatarFallback className="bg-gold/10 text-xs font-bold text-gold">
                            {organizerInitial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">{organizer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-semibold text-card-foreground">{approvedCount}</span>
                        <span>/</span>
                        <span>{maxDisplay}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
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
  recommendedUsers?: NewArrivalUser[];
  myUserId?: string | null;
  prefectureCounts?: Record<string, number>;
};

function fetchPrefectureCounts(): Promise<Record<string, number>> {
  return fetch("/api/prefecture-counts")
    .then((res) => (res.ok ? res.json() : { counts: {} }))
    .then((body: { counts?: Record<string, number> }) => body.counts ?? {})
    .catch(() => ({}));
}

export default function HomePage({ recommendedUsers = [], myUserId = null, prefectureCounts: initialPrefectureCounts = {} }: HomePageProps) {
  const { blockedIds } = useBlockedUserIds();
  const { openProfileModal } = useProfileModal();
  const [prefectureCounts, setPrefectureCounts] = useState<Record<string, number>>(initialPrefectureCounts);

  // 初期値（SSR）が変わったときに state を同期（例: ダッシュボード再訪問）
  useEffect(() => {
    setPrefectureCounts(initialPrefectureCounts);
  }, [initialPrefectureCounts]);

  // 都道府県マップ: profiles の変更を Realtime で購読 → SQL 集計を再取得して反映
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("profiles-prefecture-counts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => fetchPrefectureCounts().then(setPrefectureCounts)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => fetchPrefectureCounts().then(setPrefectureCounts)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "profiles" },
        () => fetchPrefectureCounts().then(setPrefectureCounts)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = (recommendedUsers ?? []).filter((u) => !blockedIds.has(u.id));

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <JapanMapSection
        prefectureCounts={prefectureCounts}
        myUserId={myUserId ?? null}
      />
      <RecommendedUsersSection
        users={filteredUsers}
        myUserId={myUserId}
        onOpenProfile={openProfileModal}
      />
      <RecommendedRecruitmentsSection />
      <MyScheduleSection />
      <YourGroupsSection />
    </div>
  );
}
