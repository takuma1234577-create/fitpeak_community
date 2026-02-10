"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Dumbbell, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { safeArray } from "@/lib/utils";

type ActivityItem =
  | { type: "recruitment"; id: string; title: string; description: string | null; date: string; createdAt: string }
  | { type: "group"; id: string; name: string; date: string };

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays === 1) return "昨日";
  if (diffDays < 7) return `${diffDays}日前`;
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export default function ActivityTimeline({ profileId }: { profileId?: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(!!profileId);

  const fetchActivities = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const [recResp, gmResp] = await Promise.all([
        (supabase as any)
          .from("recruitments")
          .select("id, title, description, event_date, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        (supabase as any)
          .from("group_members")
          .select("group_id, joined_at, groups(id, name)")
          .eq("user_id", id)
          .order("joined_at", { ascending: false })
          .limit(20),
      ]).catch(() => [null, null]);
      const recData = recResp?.data != null && Array.isArray(recResp.data) ? recResp.data : [];
      const gmData = gmResp?.data != null && Array.isArray(gmResp.data) ? gmResp.data : [];
      const recruitments = recData as { id: string; title: string; description: string | null; event_date: string; created_at: string }[];
      const members = gmData as { group_id: string; joined_at: string; groups: { id: string; name: string } | null }[];
      const recItems: ActivityItem[] = safeArray(recruitments).map((r) => ({
      type: "recruitment",
      id: r.id,
      title: r.title,
      description: r.description,
      date: r.event_date,
      createdAt: r.created_at,
    }));
    const groupItems: ActivityItem[] = safeArray(members)
      .filter((m) => m.groups)
      .map((m) => ({
        type: "group",
        id: m.groups!.id,
        name: m.groups!.name,
        date: m.joined_at,
      }));
      const merged = [...recItems, ...groupItems].sort((a, b) => {
        const tA = a.type === "recruitment" ? a.createdAt : a.date;
        const tB = b.type === "recruitment" ? b.createdAt : b.date;
        return tB.localeCompare(tA);
      });
      setItems(merged.slice(0, 20));
    } catch (e) {
      console.warn("[ActivityTimeline] 取得エラー (続行):", e);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (!profileId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchActivities(profileId).finally(() => setLoading(false));
  }, [profileId, fetchActivities]);

  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            最近のアクティビティ
          </h2>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-semibold text-gold/80 transition-colors hover:text-gold"
        >
          すべて見る
          <TrendingUp className="h-3 w-3" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : !Array.isArray(items) || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだアクティビティはありません</p>
      ) : (
        <div className="flex flex-col gap-0">
          {safeArray(items).map((activity, index) => {
            const arr = safeArray(items);
            const isLast = index === arr.length - 1;
            const dateIso = activity.type === "recruitment" ? activity.createdAt : activity.date;
            const timeLabel = formatTimeAgo(dateIso);
            const Icon = activity.type === "recruitment" ? Dumbbell : Users;
            const colorClass = activity.type === "recruitment" ? "bg-gold/10 text-gold" : "bg-emerald-400/10 text-emerald-400";

            return (
              <div key={`${activity.type}-${activity.id}`} className="group flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all group-hover:scale-110 ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div className="my-1 flex-1 bg-border/40 w-px" />
                  )}
                </div>
                <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-snug text-foreground">
                      {activity.type === "recruitment"
                        ? `合トレ募集: ${activity.title}`
                        : `グループに参加: ${activity.name}`}
                    </h3>
                    <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-muted-foreground/60">
                      {timeLabel}
                    </span>
                  </div>
                  {activity.type === "recruitment" && activity.description && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
