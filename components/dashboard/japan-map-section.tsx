"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  TILE_PREFECTURES,
  GRID_COLS,
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
    <div className="group flex items-center gap-3 rounded-xl border border-[#f0e6c0] bg-[#fffdf5] p-3 transition-all duration-200 hover:border-[#D4AF37]/40 hover:shadow-sm">
      <button
        type="button"
        onClick={() => openProfileModal(user.id)}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-[#D4AF37]/20">
          <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="bg-[#FFF8E1] text-xs font-bold text-[#B8960C]">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {user.bio && (
            <p className="line-clamp-1 text-[11px] text-muted-foreground leading-relaxed">
              {user.bio}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {user.prefecture && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#B8960C]">
                <MapPin className="h-2.5 w-2.5" />
                {user.prefecture}
              </span>
            )}
            {user.home_gym && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
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
                ? "bg-[#D4AF37] text-[#fff]"
                : "bg-[#FFF8E1] text-[#B8960C] hover:bg-[#D4AF37] hover:text-[#fff]"
            }`}
          >
            <UserPlus className="h-3 w-3" />
            {isFollowing ? "済" : "フォロー"}
          </button>
          <button
            type="button"
            onClick={handleChat}
            disabled={chatLoading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF8E1] text-[#B8960C] transition-all duration-200 hover:bg-[#D4AF37] hover:text-[#fff] disabled:opacity-40"
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

/** 都道府県タップ時: プロフィールの「住まい」がその都道府県のユーザー一覧を表示（prefecture と area の両方で取得してマージ） */
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
      const fields =
        "id, nickname, username, bio, avatar_url, prefecture, home_gym, exercises, created_at";
      const [byPrefecture, byArea] = await Promise.all([
        sb
          .from("profiles")
          .select(fields)
          .eq("email_confirmed", true)
          .eq("prefecture", prefecture)
          .order("created_at", { ascending: false })
          .limit(50),
        sb
          .from("profiles")
          .select(fields)
          .eq("email_confirmed", true)
          .eq("area", prefecture)
          .order("created_at", { ascending: false })
          .limit(50),
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
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label={`${prefecture}のユーザー一覧`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl border-t border-[#f0e6c0] bg-[#fff] shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-8 rounded-full bg-[#D4AF37]/30" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8E1]">
              <MapPin className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {prefecture}
              </h3>
              <p className="text-[11px] text-[#B8960C] font-medium">
                住まいが{prefecture}のトレーニー {userCount}人
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f5] text-muted-foreground transition-colors hover:bg-[#e5e5e5]"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 h-px bg-[#f0e6c0]" />

        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-8 w-8 text-[#D4AF37]/30" />
              <p className="mt-3 text-xs text-muted-foreground">
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
  }, []);

  const handleRegionToggle = useCallback((region: RegionKey) => {
    setExpandedRegion((prev) => (prev === region ? null : region));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedPrefecture(null);
  }, []);

  return (
    <section className="flex w-full min-w-0 flex-col gap-5" aria-label="地域マップ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF8E1]">
            <MapPin className="h-4 w-4 text-[#D4AF37]" />
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
          <div className="flex items-center gap-1.5 rounded-full bg-[#FFF8E1] px-3 py-1">
            <Users className="h-3 w-3 text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-[#B8960C] tabular-nums">
              {totalUsers.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#f0e6c0] bg-[#fff] p-3 sm:p-5">
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridAutoRows: "1fr",
            gap: "3px",
          }}
          role="img"
          aria-label="日本地図"
        >
          {TILE_PREFECTURES.map((pref) => {
            const count = prefectureCounts[pref.name] || 0;
            const hasUsers = count > 0;
            const isHovered = hoveredPrefecture === pref.name;
            const isSelected = selectedPrefecture === pref.name;

            let bgColor = "#FFECB3";
            let borderColor = "#FFD54F";
            let textColor = "#7B6B1A";

            if (hasUsers) {
              bgColor = "#FFD54F";
              borderColor = "#FFC107";
              textColor = "#5D4E00";
            }

            if (isSelected) {
              bgColor = "#D4AF37";
              borderColor = "#B8960C";
              textColor = "#fff";
            } else if (isHovered) {
              bgColor = hasUsers ? "#FFC107" : "#FFE082";
              borderColor = hasUsers ? "#FFB300" : "#FFD54F";
              textColor = hasUsers ? "#4E3F00" : "#6B5B14";
            }

            return (
              <button
                key={pref.name}
                type="button"
                onClick={() => handlePrefectureClick(pref.name)}
                onMouseEnter={() => setHoveredPrefecture(pref.name)}
                onMouseLeave={() => setHoveredPrefecture(null)}
                className="relative flex items-center justify-center rounded-md transition-all duration-150 active:scale-95"
                style={{
                  gridColumn:
                    pref.colSpan && pref.colSpan > 1
                      ? `${pref.col} / span ${pref.colSpan}`
                      : pref.col,
                  gridRow:
                    pref.rowSpan && pref.rowSpan > 1
                      ? `${pref.row} / span ${pref.rowSpan}`
                      : pref.row,
                  backgroundColor: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                  aspectRatio: pref.colSpan && pref.colSpan > 1 ? "auto" : "1",
                  boxShadow: isSelected
                    ? "0 2px 8px rgba(212, 175, 55, 0.4)"
                    : isHovered
                      ? "0 2px 6px rgba(212, 175, 55, 0.2)"
                      : "none",
                }}
                aria-label={`${pref.name} ${count}人`}
              >
                <span
                  className="select-none text-center font-bold leading-tight"
                  style={{ fontSize: "clamp(6px, 1.8vw, 11px)" }}
                >
                  {pref.name.replace("県", "").replace("府", "").replace("都", "")}
                </span>
                {hasUsers && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 font-bold"
                    style={{
                      fontSize: "7px",
                      backgroundColor: "#D4AF37",
                      color: "#fff",
                    }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {hoveredPrefecture && !selectedPrefecture && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#f0e6c0] bg-[#fff] px-3 py-1.5 shadow-md">
            <span className="text-xs font-semibold text-foreground">
              {hoveredPrefecture}
            </span>
            <span className="h-3 w-px bg-[#f0e6c0]" />
            <span className="text-xs font-bold text-[#D4AF37] tabular-nums">
              {prefectureCounts[hoveredPrefecture] || 0}人
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                    ? "bg-[#FFF8E1] ring-1 ring-[#D4AF37]/40"
                    : "bg-[#FAFAFA] hover:bg-[#FFF8E1]"
                }`}
              >
                <span
                  className={`text-[11px] font-bold tracking-tight ${
                    isExpanded ? "text-[#B8960C]" : "text-foreground"
                  }`}
                >
                  {REGION_LABELS[region]}
                </span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      isExpanded ? "text-[#D4AF37]" : "text-muted-foreground"
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
          <div className="flex flex-col gap-1 rounded-xl border border-[#f0e6c0] bg-[#fffdf5] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {getPrefecturesByRegion(expandedRegion).map((name) => {
              const count = prefectureCounts[name] || 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePrefectureClick(name)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-150 hover:bg-[#FFF8E1]"
                >
                  <span className="text-xs font-semibold text-foreground">{name}</span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && (
                      <span className="text-[11px] font-bold text-[#D4AF37] tabular-nums">
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
