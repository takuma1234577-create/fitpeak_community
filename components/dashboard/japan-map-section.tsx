"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  MessageCircle,
  X,
  ChevronDown,
  Loader2,
  Dumbbell,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import { useFollow } from "@/hooks/use-follow";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { useProfileModal } from "@/contexts/profile-modal-context";
import { getOrCreateConversation } from "@/lib/conversations";
import {
  PREFECTURES_MAP,
  REGION_LABELS,
  REGION_ORDER,
  REGION_COLORS,
  PREFECTURE_REGION_MAP,
  getPrefecturesByRegion,
  type RegionKey,
} from "@/lib/japan-map-paths";

type PrefectureCounts = Record<string, number>;

type PrefectureUser = {
  id: string;
  nickname: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  prefecture: string | null;
  home_gym: string | null;
  exercises: string[] | null;
};

type JapanMapSectionProps = {
  prefectureCounts: PrefectureCounts;
  myUserId: string | null;
};

function PrefectureUserCard({
  user,
  myUserId,
}: {
  user: PrefectureUser;
  myUserId: string | null;
}) {
  const { isFollowing, toggle, loading: followLoading } = useFollow(user.id, myUserId);
  const { openProfileModal } = useProfileModal();
  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);

  const name = user.nickname || user.username || "ユーザー";
  const initial = name.charAt(0);
  const showActions = myUserId && myUserId !== user.id;

  const handleChat = useCallback(async () => {
    if (!myUserId || !user.id || myUserId === user.id) return;
    setChatLoading(true);
    try {
      const convId = await getOrCreateConversation(myUserId, user.id);
      router.push(`/dashboard/messages/${convId}`);
    } catch (e) {
      console.error("chat error:", e);
    } finally {
      setChatLoading(false);
    }
  }, [myUserId, user.id, router]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-4 py-3 transition-all hover:border-gold/30">
      <button
        type="button"
        onClick={() => openProfileModal(user.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar className="h-11 w-11 shrink-0 ring-2 ring-border/60">
          <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-secondary text-sm font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-bold text-foreground">{name}</p>
          {user.bio && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {user.bio}
            </p>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {user.prefecture && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {user.prefecture}
              </span>
            )}
            {user.home_gym && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Dumbbell className="h-3 w-3" />
                {user.home_gym}
              </span>
            )}
          </div>
        </div>
      </button>

      {showActions && (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            disabled={followLoading}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all disabled:opacity-60 ${
              isFollowing
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-border bg-secondary text-foreground hover:border-gold/30"
            }`}
          >
            {isFollowing ? "フォロー中" : "フォロー"}
          </button>
          <button
            type="button"
            onClick={handleChat}
            disabled={chatLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-all hover:border-gold/30 hover:text-gold disabled:opacity-60"
            aria-label="チャットする"
          >
            {chatLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function PrefectureUsersPanel({
  prefecture,
  userCount,
  myUserId,
  onClose,
}: {
  prefecture: string;
  userCount: number;
  myUserId: string | null;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<PrefectureUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { blockedIds } = useBlockedUserIds();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select(
          "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises"
        )
        .eq("prefecture", prefecture)
        .eq("email_confirmed", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!cancelled) {
        if (error) {
          console.error("prefecture users fetch:", error);
          setUsers([]);
        } else {
          setUsers(safeList(data as PrefectureUser[]));
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefecture]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filteredUsers = users.filter((u) => !blockedIds.has(u.id));

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-foreground/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label={`${prefecture}のユーザー一覧`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl border-t border-border/60 bg-background shadow-lg animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between border-b border-border/40 px-5 pb-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-5 w-5 text-gold" />
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                {prefecture}
              </h3>
              <p className="text-xs text-muted-foreground">
                {userCount}人のトレーニー
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-gold/60" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                この地域にはまだユーザーがいません
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredUsers.map((user) => (
                <PrefectureUserCard
                  key={user.id}
                  user={user}
                  myUserId={myUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function JapanMapSection({
  prefectureCounts,
  myUserId,
}: JapanMapSectionProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(
    null
  );
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(
    null
  );
  const [expandedRegion, setExpandedRegion] = useState<RegionKey | null>(null);

  const regionCounts: Record<RegionKey, number> = {
    hokkaido: 0,
    tohoku: 0,
    kanto: 0,
    chubu: 0,
    kinki: 0,
    chugoku: 0,
    shikoku: 0,
    kyushu: 0,
  };

  for (const [pref, count] of Object.entries(prefectureCounts)) {
    const region = PREFECTURE_REGION_MAP[pref];
    if (region) {
      regionCounts[region] += count;
    }
  }

  const totalUsers = Object.values(prefectureCounts).reduce(
    (a, b) => a + b,
    0
  );

  const handlePrefectureClick = useCallback((name: string) => {
    setSelectedPrefecture(name);
  }, []);

  const handleRegionToggle = useCallback((region: RegionKey) => {
    setExpandedRegion((prev) => (prev === region ? null : region));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedPrefecture(null);
  }, []);

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4"
      aria-label="地域マップ"
    >
      <div className="flex items-center gap-2.5">
        <MapPin className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-extrabold tracking-wide text-foreground">
          エリアで仲間を探す
        </h2>
        {totalUsers > 0 && (
          <span className="ml-auto rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold">
            全国 {totalUsers}人
          </span>
        )}
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-card">
        <svg
          viewBox="180 0 740 960"
          className="h-auto w-full"
          role="img"
          aria-label="日本地図"
        >
          {PREFECTURES_MAP.map((pref) => {
            const isHovered = hoveredPrefecture === pref.name;
            const isSelected = selectedPrefecture === pref.name;
            const regionColor = REGION_COLORS[pref.region];
            const count = prefectureCounts[pref.name] || 0;

            let fillColor = regionColor.fill;
            if (isSelected) fillColor = "#D4AF37";
            else if (isHovered) fillColor = regionColor.hover;

            return (
              <g key={pref.name}>
                <path
                  d={pref.path}
                  fill={fillColor}
                  stroke={isSelected ? "#B8952F" : "#C8C0A8"}
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer transition-colors duration-150"
                  onMouseEnter={() => setHoveredPrefecture(pref.name)}
                  onMouseLeave={() => setHoveredPrefecture(null)}
                  onClick={() => handlePrefectureClick(pref.name)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${pref.name} ${count}人`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePrefectureClick(pref.name);
                    }
                  }}
                />
                {count > 0 && (
                  <g
                    className="pointer-events-none"
                    transform={`translate(${pref.labelX}, ${pref.labelY})`}
                  >
                    <circle
                      r="12"
                      fill="#D4AF37"
                      opacity="0.9"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#050505"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredPrefecture && !selectedPrefecture && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg bg-foreground/90 px-3 py-1.5 text-xs font-bold text-background shadow-lg">
            {hoveredPrefecture}{" "}
            <span className="text-gold">
              {prefectureCounts[hoveredPrefecture] || 0}人
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          地方から探す
        </p>
        <div className="flex flex-wrap gap-2">
          {REGION_ORDER.map((region) => {
            const isExpanded = expandedRegion === region;
            const count = regionCounts[region];

            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionToggle(region)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  isExpanded
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-border/60 bg-card text-foreground hover:border-gold/30"
                }`}
              >
                {REGION_LABELS[region]}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isExpanded
                        ? "bg-gold/20 text-gold"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>

        {expandedRegion && (
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/40 bg-card/50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {getPrefecturesByRegion(expandedRegion).map((name) => {
              const count = prefectureCounts[name] || 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePrefectureClick(name)}
                  className="flex items-center gap-1 rounded-lg border border-border/40 bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:border-gold/30 hover:bg-gold/5"
                >
                  {name}
                  {count > 0 && (
                    <span className="ml-0.5 text-[10px] font-bold text-gold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedPrefecture && (
        <PrefectureUsersPanel
          prefecture={selectedPrefecture}
          userCount={prefectureCounts[selectedPrefecture] || 0}
          myUserId={myUserId}
          onClose={handleClosePanel}
        />
      )}
    </section>
  );
}
