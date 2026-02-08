"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Dumbbell,
  Users,
  Handshake,
  Settings,
  Share2,
  ChevronLeft,
  Target,
  Calendar,
} from "lucide-react";

interface ProfileHeaderProps {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  area: string | null;
  gym: string | null;
  goal: string | null;
  trainingYears: number;
  followersCount: number;
  followingCount: number;
  collabCount: number;
}

export default function ProfileHeader({
  name,
  bio,
  avatarUrl,
  area,
  gym,
  goal,
  trainingYears,
  followersCount,
  followingCount,
  collabCount,
}: ProfileHeaderProps) {
  const router = useRouter();

  const stats = [
    { label: "フォロワー", value: followersCount.toLocaleString() },
    { label: "フォロー中", value: followingCount.toLocaleString() },
    { label: "合トレ実績", value: collabCount.toLocaleString() },
  ];

  const initial = name.charAt(0).toUpperCase();

  return (
    <section className="relative">
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/20 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
              aria-label="共有"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
              aria-label="設定"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-6 sm:px-8">
        <div className="-mt-16 mb-4 flex items-end gap-4">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-xl shadow-black/40 sm:h-32 sm:w-32">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5 text-gold">
                  <span className="text-4xl font-black sm:text-5xl">
                    {initial}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-background bg-emerald-500" />
          </div>

          <div className="ml-auto mb-2 hidden items-center gap-2 sm:flex">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98]"
            >
              <Handshake className="h-4 w-4" />
              合トレ申請
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-bold tracking-wide text-foreground transition-all hover:border-gold/30 hover:bg-secondary/80"
            >
              <Users className="h-4 w-4" />
              フォロー
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {name}
          </h1>
          {bio && (
            <p className="mt-1 text-sm font-semibold tracking-wide text-gold">
              {bio}
            </p>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {goal && (
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">{goal}</span>
            </span>
          )}
          {trainingYears > 0 && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">
                トレ歴 {trainingYears}年
              </span>
            </span>
          )}
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {gym && (
            <span className="flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">{gym}</span>
            </span>
          )}
          {area && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">{area}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-0 border-t border-border/60 pt-5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 text-center ${
                i !== stats.length - 1 ? "border-r border-border/40" : ""
              }`}
            >
              <p className="text-xl font-black text-foreground sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 sm:hidden">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light active:scale-[0.98]"
          >
            <Handshake className="h-4 w-4" />
            合トレ申請
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-3 text-sm font-bold tracking-wide text-foreground transition-all hover:border-gold/30"
          >
            <Users className="h-4 w-4" />
            フォロー
          </button>
        </div>
      </div>
    </section>
  );
}
