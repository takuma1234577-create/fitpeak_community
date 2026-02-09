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
  Sparkles,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import type { RecruitmentsRow } from "@/types/supabase";
import type { ProfilesRow } from "@/types/supabase";

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

function formatRecruitDate(d: string) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatRecruitTime(d: string) {
  const date = new Date(d);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) + "~";
}

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
          className="flex items-center gap-1 text-xs font-semibold text-gold/80 transition-colors hover:text-gold"
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
          {todayMotivation.date}
        </p>
        <h1 className="text-balance text-2xl font-black leading-tight text-foreground sm:text-3xl">
          {todayMotivation.greeting}
        </h1>
        <p className="text-sm font-bold text-gold sm:text-base">
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
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold transition-colors hover:text-gold-light"
        >
          合トレ募集を探す
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

type RecruitmentWithProfile = RecruitmentsRow & { profiles: ProfilesRow | null };

function RecommendedSection() {
  const [posts, setPosts] = useState<RecruitmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("recruitments")
        .select("*, profiles(*)")
        .eq("status", "open")
        .neq("user_id", user.id)
        .order("event_date", { ascending: true })
        .limit(10);
      if (!cancelled) {
        if (error) {
          console.error("recruitments fetch:", error);
          setPosts([]);
        } else {
          setPosts((data as RecruitmentWithProfile[]) ?? []);
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-wide text-foreground">
            あなたへのおすすめ
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-wide text-foreground">
            あなたへのおすすめ
          </h2>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            いま募集中の募集はありません
          </p>
          <Link
            href="/dashboard/recruit"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold transition-colors hover:text-gold-light"
          >
            合トレ募集を見る
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-wide text-foreground">
            あなたへのおすすめ
          </h2>
        </div>
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
            href="/dashboard/recruit"
            className="ml-2 flex items-center gap-1 text-xs font-semibold text-gold/80 transition-colors hover:text-gold"
          >
            すべて見る
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 lg:-mx-0 lg:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map((post) => {
          const profile = post.profiles;
          const name = profile?.nickname || profile?.username || "ユーザー";
          const initial = name.charAt(0);
          const tags = post.target_body_part ? [post.target_body_part] : [];
          return (
            <Link
              key={post.id}
              href={`/dashboard/recruit#${post.id}`}
              className="group flex w-[300px] shrink-0 flex-col rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.04]"
            >
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-gold" />
                  <span className="font-bold">{formatRecruitDate(post.event_date)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRecruitTime(post.event_date)}
                  </span>
                </div>
                {post.location && (
                  <div className="flex max-w-[100px] items-center gap-1 truncate text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0 text-gold/70" />
                    <span className="truncate font-medium">{post.location}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                  {post.title}
                </h3>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="border-0 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold/90 hover:bg-gold/20"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="relative h-7 w-7 shrink-0 ring-1 ring-border">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
                    <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-muted-foreground truncate max-w-[140px]">
                    {name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-gold/60" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function YourGroupsSection() {
  const [groups, setGroups] = useState<{ id: string; name: string; unread: number }[]>([]);
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
      const membersList = (members ?? []) as { group_id: string }[];
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
        .select("id, name")
        .in("id", ids);
      const groupListTyped = (groupList ?? []) as { id: string; name: string }[];
      if (!cancelled) {
        if (error) {
          console.error("groups fetch:", error);
          setGroups([]);
        } else {
          setGroups(groupListTyped.map((g) => ({ id: g.id, name: g.name, unread: 0 })));
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
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/dashboard/groups/${group.id}`}
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
                      <span className="flex items-center gap-1 text-gold/80">
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

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <HeroSection />
      <MyScheduleSection />
      <RecommendedSection />
      <YourGroupsSection />
    </div>
  );
}
