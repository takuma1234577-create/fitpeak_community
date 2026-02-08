"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const groupData: Record<
  string,
  { name: string; description: string; category: string; image: string; memberCount: number }
> = {
  "bench-100": {
    name: "ベンチプレス100kg目指す部",
    description: "ベンチ100kgを目標にフォーム改善やプログラムを共有し合うグループです。初心者大歓迎! 週末に合トレも開催中。",
    category: "ガチ勢",
    image: "/placeholder.svg",
    memberCount: 24,
  },
  "summer-diet": {
    name: "夏までに絞る会 2026",
    description: "食事管理と有酸素の併用で夏までに体脂肪率10%台を目指すグループ。毎日の食事記録を共有。",
    category: "減量",
    image: "/placeholder.svg",
    memberCount: 42,
  },
  "deadlift-lovers": {
    name: "デッドリフト愛好会",
    description: "コンベンショナル派もスモウ派も集まれ! 週1で合トレしています。フォームチェック歓迎。",
    category: "ガチ勢",
    image: "/placeholder.svg",
    memberCount: 18,
  },
};

const members = [
  { name: "佐藤 健二", role: "部長", initial: "佐" },
  { name: "田中 花子", role: "メンバー", initial: "田" },
  { name: "鈴木 一郎", role: "メンバー", initial: "鈴" },
];

export default function GroupDetail({ groupId }: { groupId: string }) {
  const group = groupData[groupId] ?? {
    name: "部活",
    description: "",
    category: "その他",
    image: "/placeholder.svg",
    memberCount: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/groups"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black tracking-tight text-foreground">
          {group.name}
        </h1>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border/60 bg-card">
        <Image
          src={group.image}
          alt={group.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="line-clamp-2 text-sm font-bold text-white">
            {group.description}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-gold">
            <Users className="h-4 w-4" />
            {group.memberCount}人
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 text-sm font-bold text-foreground">メンバー</h2>
        <div className="flex flex-col gap-3">
          {members.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/30 px-4 py-3"
            >
              <Avatar className="h-10 w-10 ring-1 ring-border">
                <AvatarImage src="/placeholder.svg" alt={m.name} />
                <AvatarFallback className="text-xs font-bold text-gold">
                  {m.initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
              {m.role === "部長" && (
                <Crown className="h-4 w-4 text-gold" />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-gold/40 bg-transparent py-3.5 text-sm font-bold text-gold transition-all hover:border-gold hover:bg-gold hover:text-[#050505]"
      >
        参加する
      </button>
    </div>
  );
}
