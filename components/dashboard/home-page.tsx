"use client";

import React, { useRef } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

const mySchedule = {
  id: "1",
  title: "胸トレ合トレ募集！ベンチ100kg目指してる方一緒にやりましょう",
  date: "2/10",
  time: "19:00~",
  location: "ゴールドジム原宿",
  tags: ["胸トレ", "合トレ", "ガチ勢"],
  user: { name: "田中 健二", initial: "田" },
  spots: 4,
  spotsLeft: 2,
  role: "参加者" as const,
};

const recommended = [
  {
    id: "r1",
    title: "脚の日！スクワット中心にやります。補助お願いしたいです",
    date: "2/11",
    time: "10:00~",
    location: "エニタイム渋谷",
    tags: ["脚トレ", "スクワット"],
    user: { name: "鈴木 ユキ", initial: "鈴" },
    spots: 3,
    spotsLeft: 1,
  },
  {
    id: "r2",
    title: "デッドリフト200kg超えメンバー集合！背中の日やりましょう",
    date: "2/12",
    time: "18:30~",
    location: "パワーハウスジム新宿",
    tags: ["背中", "デッドリフト"],
    user: { name: "佐藤 太郎", initial: "佐" },
    spots: 3,
    spotsLeft: 3,
  },
  {
    id: "r3",
    title: "女性限定！ヒップアップ＆脚トレを楽しくやりませんか？",
    date: "2/13",
    time: "11:00~",
    location: "ゴールドジム銀座",
    tags: ["脚トレ", "女性限定"],
    user: { name: "山田 ミカ", initial: "山" },
    spots: 6,
    spotsLeft: 4,
  },
  {
    id: "r4",
    title: "肩トレ強化DAY！サイドレイズ地獄やりたい人募集",
    date: "2/14",
    time: "20:00~",
    location: "エニタイム池袋",
    tags: ["肩トレ", "中級者"],
    user: { name: "高橋 リョウ", initial: "高" },
    spots: 4,
    spotsLeft: 2,
  },
  {
    id: "r5",
    title: "全身トレーニング！初心者大歓迎、フォーム教えます",
    date: "2/15",
    time: "09:00~",
    location: "ティップネス六本木",
    tags: ["全身", "初心者歓迎"],
    user: { name: "伊藤 サキ", initial: "伊" },
    spots: 5,
    spotsLeft: 5,
  },
];

const myGroups = [
  {
    id: "bench-100",
    name: "ベンチプレス100kg目指す部",
    unread: 3,
  },
  {
    id: "summer-diet",
    name: "夏までに絞る会 2026",
    unread: 0,
  },
  {
    id: "deadlift-lovers",
    name: "デッドリフト愛好会",
    unread: 1,
  },
];

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
  const s = mySchedule;
  const spotsPercent = ((s.spots - s.spotsLeft) / s.spots) * 100;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader icon={Clock} title="参加予定" />
      <article className="relative overflow-hidden rounded-xl border border-gold/20 bg-card transition-all hover:border-gold/40">
        <div className="absolute left-0 top-0 h-full w-1 bg-gold" />
        <div className="flex flex-col gap-2 border-b border-border/40 px-5 py-3 pl-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-gold" />
              <span className="font-bold">{s.date}</span>
              <span className="text-muted-foreground">{s.time}</span>
            </div>
            <Badge className="border-0 bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold hover:bg-gold/15">
              {s.role}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-gold/70" />
            <span className="font-medium">{s.location}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4 pl-6">
          <h3 className="line-clamp-2 text-balance text-sm font-bold leading-snug text-foreground">
            {s.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="border-0 bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold/90 hover:bg-gold/20"
              >
                #{tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar className="relative h-7 w-7 shrink-0 ring-1 ring-border">
                <AvatarImage src="/placeholder.svg" alt={s.user.name} />
                <AvatarFallback className="text-[10px]">
                  {s.user.initial}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-muted-foreground">
                {s.user.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gold/60"
                  style={{ width: `${spotsPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold">
                <span className="text-gold">{s.spotsLeft}</span>
                <span className="text-muted-foreground">/{s.spots}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function RecommendedSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

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
        {recommended.map((post) => {
          const pct = ((post.spots - post.spotsLeft) / post.spots) * 100;
          return (
            <article
              key={post.id}
              className="group flex w-[300px] shrink-0 flex-col rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.04]"
            >
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-gold" />
                  <span className="font-bold">{post.date}</span>
                  <span className="text-xs text-muted-foreground">
                    {post.time}
                  </span>
                </div>
                <div className="flex max-w-[100px] items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0 text-gold/70" />
                  <span className="truncate font-medium">{post.location}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                  {post.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-0 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold/90 hover:bg-gold/20"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="relative h-7 w-7 shrink-0 ring-1 ring-border">
                    <AvatarImage src="/placeholder.svg" alt={post.user.name} />
                    <AvatarFallback className="text-[10px]">
                      {post.user.initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {post.user.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gold/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold">
                    <span className="text-gold">{post.spotsLeft}</span>
                    <span className="text-muted-foreground">/{post.spots}</span>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function YourGroupsSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={Shield}
        title="所属部活の更新"
        href="/dashboard/groups"
        linkLabel="すべて見る"
      />
      <div className="flex flex-col gap-2">
        {myGroups.map((group) => (
          <Link
            key={group.id}
            href={`/dashboard/groups/${group.id}`}
            className="flex items-center gap-4 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all duration-200 hover:border-gold/30 hover:bg-card/80"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60">
              <Image
                src="/placeholder.svg"
                alt={group.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-bold text-foreground">
                {group.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {group.unread > 0 ? (
                  <span className="flex items-center gap-1 text-gold/80">
                    <MessageCircle className="h-3 w-3" />
                    {group.unread}件の新着メッセージ
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
