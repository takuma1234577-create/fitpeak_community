"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Dumbbell,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import { useFollow } from "@/hooks/use-follow";
import { getOrCreateConversation } from "@/lib/conversations";

type MatchUser = {
  id: string;
  nickname: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  header_url: string | null;
  prefecture: string | null;
  home_gym: string | null;
  exercises: string[] | null;
};

/* ---------- single card ---------- */

function MatchCard({
  user,
  myUserId,
  onOpenProfile,
}: {
  user: MatchUser;
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const { isFollowing, toggle, loading: followLoading } = useFollow(user.id, myUserId);
  const [msgLoading, setMsgLoading] = useState(false);
  const router = useRouter();

  const name = user.nickname || user.username || "ユーザー";
  const initial = name.charAt(0);
  const showActions = myUserId && myUserId !== user.id;
  const tags = safeList(user.exercises as string[] | null).filter(Boolean).slice(0, 4);

  const handleMessage = useCallback(async () => {
    if (!myUserId || !user.id || myUserId === user.id) return;
    setMsgLoading(true);
    try {
      const convId = await getOrCreateConversation(myUserId, user.id);
      router.push(`/dashboard/messages/${convId}`);
    } catch (e) {
      console.error("message start error:", e);
    } finally {
      setMsgLoading(false);
    }
  }, [myUserId, user.id, router]);

  return (
    <div className="relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-200 hover:shadow-md sm:w-[300px]">
      {/* Header image area */}
      <button
        type="button"
        onClick={() => onOpenProfile(user.id)}
        className="relative h-28 w-full overflow-hidden bg-secondary"
      >
        {user.header_url ? (
          <Image
            src={user.header_url}
            alt=""
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="300px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-secondary to-gold/10" />
        )}
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
      </button>

      {/* Avatar overlapping the header */}
      <div className="relative -mt-8 flex flex-col items-center px-4">
        <button
          type="button"
          onClick={() => onOpenProfile(user.id)}
          className="relative z-10 rounded-full ring-[3px] ring-card"
        >
          <Avatar className="h-16 w-16 border-2 border-card">
            <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
            <AvatarFallback className="bg-secondary text-base font-bold text-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* User info */}
        <button
          type="button"
          onClick={() => onOpenProfile(user.id)}
          className="mt-2 flex flex-col items-center gap-1 text-center"
        >
          <h3 className="max-w-[220px] truncate text-sm font-bold text-foreground">{name}</h3>
          {(user.prefecture || user.home_gym) && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {user.prefecture && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 text-gold/70" />
                  {user.prefecture}
                </span>
              )}
              {user.home_gym && (
                <span className="flex items-center gap-0.5">
                  <Dumbbell className="h-3 w-3 text-gold/70" />
                  <span className="max-w-[100px] truncate">{user.home_gym}</span>
                </span>
              )}
            </div>
          )}
        </button>

        {/* Bio */}
        {user.bio && (
          <p className="mt-2 line-clamp-2 w-full text-center text-xs leading-relaxed text-muted-foreground">
            {user.bio}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full border-0 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold text-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-auto flex gap-2 px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            disabled={followLoading}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-60 ${
              isFollowing
                ? "bg-gold/15 text-gold"
                : "bg-gold text-card-foreground hover:bg-gold-light"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {isFollowing ? "フォロー中" : "フォロー"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMessage();
            }}
            disabled={msgLoading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-2.5 text-xs font-bold text-foreground transition-all hover:border-gold/30 hover:bg-secondary/80 disabled:opacity-60"
          >
            {msgLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" />
            )}
            メッセージ
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- carousel section ---------- */

export default function UserMatchingCarousel({
  myUserId,
  onOpenProfile,
}: {
  myUserId: string | null;
  onOpenProfile: (userId: string) => void;
}) {
  const [users, setUsers] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* fetch profiles */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const fields =
        "id, nickname, username, bio, avatar_url, header_url, prefecture, home_gym, exercises";

      let query = (supabase as any)
        .from("profiles")
        .select(fields)
        .order("created_at", { ascending: false })
        .limit(15);

      if (myUserId) {
        query = query.neq("id", myUserId);
      }

      const { data, error } = await query;
      if (!cancelled) {
        if (error) {
          console.error("user matching fetch:", error);
          setUsers([]);
        } else {
          setUsers(safeList((data ?? []) as MatchUser[]));
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myUserId]);

  /* scroll indicators */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [users, updateScrollState]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  /* loading state */
  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <h2 className="text-base font-bold text-foreground">おすすめユーザー</h2>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      </section>
    );
  }

  if (users.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <h2 className="text-base font-bold text-foreground">おすすめユーザー</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 sm:flex"
            aria-label="前へスクロール"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 sm:flex"
            aria-label="次へスクロール"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:-mx-0 lg:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {users.map((user) => (
          <div key={user.id} className="snap-start">
            <MatchCard
              user={user}
              myUserId={myUserId}
              onOpenProfile={onOpenProfile}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators (mobile) */}
      <div className="flex justify-center gap-1.5 sm:hidden" aria-hidden>
        {users.slice(0, 5).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === 0 ? "w-4 bg-gold" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
