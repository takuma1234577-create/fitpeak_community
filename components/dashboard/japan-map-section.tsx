"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  MessageCircle,
  X,
  Loader2,
  Dumbbell,
  UserPlus,
  ChevronRight,
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
  created_at?: string;
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
    <div className="group flex items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-3 transition-all duration-200 hover:border-gold/30 hover:bg-[#111]">
      <button
        type="button"
        onClick={() => openProfileModal(user.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-[#222]">
          <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-[#1a1a1a] text-xs font-bold text-[#999]">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-[#e5e5e5]">{name}</p>
          {user.bio && (
            <p className="line-clamp-1 text-[11px] text-[#666] leading-relaxed">
              {user.bio}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {user.prefecture && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#555]">
                <MapPin className="h-2.5 w-2.5" />
                {user.prefecture}
              </span>
            )}
            {user.home_gym && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#555]">
                <Dumbbell className="h-2.5 w-2.5" />
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
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 disabled:opacity-40 ${
              isFollowing
                ? "bg-gold/15 text-gold"
                : "bg-[#1a1a1a] text-[#888] hover:bg-gold/10 hover:text-gold"
            }`}
          >
            <UserPlus className="h-3 w-3" />
            {isFollowing ? "済" : "フォロー"}
          </button>
          <button
            type="button"
            onClick={handleChat}
            disabled={chatLoading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#888] transition-all duration-200 hover:bg-gold/10 hover:text-gold disabled:opacity-40"
            aria-label="チャットする"
          >
            {chatLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MessageCircle className="h-3 w-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** 都道府県タップ時: プロフィールの「住まい」がその都道府県のユーザー一覧を表示 */
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const sb = supabase as any;
      // プロフィールの「住まい」(prefecture または area) が選択都道府県と一致するユーザーを全員取得
      const fields = "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, created_at";
      const [byPrefecture, byArea] = await Promise.all([
        sb.from("profiles").select(fields).eq("email_confirmed", true).eq("prefecture", prefecture).order("created_at", { ascending: false }).limit(50),
        sb.from("profiles").select(fields).eq("email_confirmed", true).eq("area", prefecture).order("created_at", { ascending: false }).limit(50),
      ]);

      if (cancelled) return;
      const seen = new Set<string>();
      const merged: PrefectureUser[] = [];
      for (const row of safeList((byPrefecture.data ?? []) as PrefectureUser[])) {
        if (row?.id && !seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row);
        }
      }
      for (const row of safeList((byArea.data ?? []) as PrefectureUser[])) {
        if (row?.id && !seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row);
        }
      }
      merged.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      setUsers(merged.slice(0, 50));
      setLoading(false);
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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label={`${prefecture}のユーザー一覧`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl border-t border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-8 rounded-full bg-[#333]" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10">
              <MapPin className="h-4 w-4 text-gold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e5e5e5] tracking-tight">
                {prefecture}
              </h3>
              <p className="text-[11px] text-[#666] font-medium">
                住まいが{prefecture}のトレーニー {userCount}人
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#666] transition-colors hover:text-[#999]"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 h-px bg-[#1a1a1a]" />

        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gold/40" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-8 w-8 text-[#333]" />
              <p className="mt-3 text-xs text-[#555]">
                住まいが{prefecture}のユーザーはまだいません
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredUsers.map((user) => (
                <PrefectureUserCard key={user.id} user={user} myUserId={myUserId} />
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
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<RegionKey | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
    if (region) regionCounts[region] += count;
  }

  const totalUsers = Object.values(prefectureCounts).reduce((a, b) => a + b, 0);

  const handlePrefectureClick = useCallback((name: string) => {
    setSelectedPrefecture(name);
    setHoveredPrefecture(null);
    setTooltipPos(null);
  }, []);

  const handleRegionToggle = useCallback((region: RegionKey) => {
    setExpandedRegion((prev) => (prev === region ? null : region));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedPrefecture(null);
  }, []);

  const handleMouseEnter = useCallback((name: string, e: React.MouseEvent<SVGPathElement>) => {
    setHoveredPrefecture(name);
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const pathRect = (e.target as SVGPathElement).getBoundingClientRect();
      const x = pathRect.left + pathRect.width / 2 - svgRect.left;
      const y = pathRect.top - svgRect.top - 8;
      setTooltipPos({ x, y });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredPrefecture(null);
    setTooltipPos(null);
  }, []);

  return (
    <section className="flex w-full min-w-0 flex-col gap-5" aria-label="地域マップ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <MapPin className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              エリアで仲間を探す
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              都道府県をタップして近くのトレーニーを見つけよう
            </p>
          </div>
        </div>
        {totalUsers > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1">
            <Users className="h-3 w-3 text-gold" />
            <span className="text-[11px] font-bold text-gold tabular-nums">
              {totalUsers.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 60% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative p-4">
          <svg
            ref={svgRef}
            viewBox="180 0 740 960"
            className="h-auto w-full"
            role="img"
            aria-label="日本地図"
          >
            <defs>
              <filter id="japan-map-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {PREFECTURES_MAP.map((pref) => {
              const isHovered = hoveredPrefecture === pref.name;
              const isSelected = selectedPrefecture === pref.name;
              const count = prefectureCounts[pref.name] || 0;
              const hasUsers = count > 0;

              let fillColor = hasUsers ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)";
              let strokeColor = hasUsers ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)";
              let strokeWidth = 0.8;

              if (isSelected) {
                fillColor = "rgba(212,175,55,0.25)";
                strokeColor = "rgba(212,175,55,0.7)";
                strokeWidth = 1.5;
              } else if (isHovered) {
                fillColor = hasUsers ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)";
                strokeColor = hasUsers ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.15)";
                strokeWidth = 1.2;
              }

              return (
                <g key={pref.name}>
                  <path
                    d={pref.path}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="cursor-pointer"
                    style={{
                      transition:
                        "fill 0.2s ease, stroke 0.2s ease, stroke-width 0.15s ease",
                      filter:
                        (isHovered || isSelected) && hasUsers
                          ? "url(#japan-map-glow)"
                          : "none",
                    }}
                    onMouseEnter={(e) => handleMouseEnter(pref.name, e)}
                    onMouseLeave={handleMouseLeave}
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
                  {hasUsers && (
                    <g transform={`translate(${pref.labelX}, ${pref.labelY})`}>
                      <circle
                        r="8"
                        fill="none"
                        stroke="rgba(212,175,55,0.2)"
                        strokeWidth="1"
                      >
                        <animate
                          attributeName="r"
                          values="8;14;8"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;0;0.4"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        r="4"
                        fill="#D4AF37"
                        opacity="0.85"
                        filter="url(#japan-map-glow)"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#0a0a0a"
                        fontSize="5.5"
                        fontWeight="800"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {count > 99 ? "99+" : count}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {hoveredPrefecture && tooltipPos && !selectedPrefecture && (
            <div
              className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-lg border border-[#222] bg-[#111] px-3 py-1.5 shadow-xl"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <span className="text-xs font-semibold text-[#ccc]">
                {hoveredPrefecture}
              </span>
              <span className="h-3 w-px bg-[#333]" />
              <span className="text-xs font-bold text-gold tabular-nums">
                {prefectureCounts[hoveredPrefecture] || 0}人
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          地方から探す
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {REGION_ORDER.map((region) => {
            const isExpanded = expandedRegion === region;
            const count = regionCounts[region];

            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionToggle(region)}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-all duration-200 ${
                  isExpanded
                    ? "bg-gold/10 ring-1 ring-gold/30"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                <span
                  className={`text-[11px] font-bold tracking-tight ${
                    isExpanded ? "text-gold" : "text-foreground"
                  }`}
                >
                  {REGION_LABELS[region]}
                </span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      isExpanded ? "text-gold/70" : "text-muted-foreground"
                    }`}
                  >
                    {count}人
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {expandedRegion && (
          <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {getPrefecturesByRegion(expandedRegion).map((name) => {
              const count = prefectureCounts[name] || 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePrefectureClick(name)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-150 hover:bg-secondary"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && (
                      <span className="text-[11px] font-bold tabular-nums text-gold">
                        {count}人
                      </span>
                    )}
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
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
