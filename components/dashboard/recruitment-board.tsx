"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import FilterBar from "@/components/dashboard/filter-bar";
import RecruitmentCard, {
  type RecruitmentPost,
} from "@/components/dashboard/recruitment-card";
import { useRecruitModal } from "@/contexts/recruit-modal-context";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { createClient } from "@/utils/supabase/client";

type SortKey = "newest" | "date_nearest" | "date_furthest";

export default function RecruitmentBoard() {
  const { openModal } = useRecruitModal();
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string>("");
  const [participantStatusByRecruitment, setParticipantStatusByRecruitment] = useState<Record<string, "pending" | "approved" | "rejected" | "withdrawn">>({});
  const { blockedIds } = useBlockedUserIds();

  const fetchRecruitments = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyUserId(user.id);
        const { data: profile } = await (supabase as any).from("profiles").select("nickname, username").eq("id", user.id).single();
        const name = profile?.nickname || profile?.username || "ユーザー";
        setMyDisplayName(name);
      }

      const { data: rows, error } = await (supabase as any)
        .from("recruitments")
        .select("id, title, description, target_body_part, event_date, location, status, created_at, user_id, profiles(id, nickname, username, avatar_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const list = Array.isArray(rows) ? rows : rows != null ? [rows] : [];
      const mapped = list.map((r: Record<string, unknown>) => {
        const eventDate = r.event_date != null ? String(r.event_date) : "";
        const d = eventDate ? new Date(eventDate) : new Date();
        const dateStr = Number.isNaN(d.getTime()) ? "—" : `${d.getMonth() + 1}/${d.getDate()}`;
        const timeStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) + "~";
        const prof = r.profiles as { id?: string; nickname?: string | null; username?: string | null; avatar_url?: string | null } | null | undefined;
        const name = (prof?.nickname ?? prof?.username ?? "ユーザー") as string;
        const tags = r.target_body_part ? [String(r.target_body_part)] : [];
        return {
          id: String(r.id),
          title: String(r.title ?? ""),
          description: r.description != null ? String(r.description) : "",
          date: dateStr,
          time: timeStr,
          location: r.location != null ? String(r.location) : "未設定",
          tags,
          user_id: String(r.user_id ?? ""),
          user: { name, title: "", initial: name.charAt(0) || "?", avatar: prof?.avatar_url ?? undefined },
          spots: 1,
          spotsLeft: 1,
          event_date: eventDate,
        };
      });
      setPosts(mapped);

      if (user && mapped.length > 0) {
        const ids = mapped.map((p) => p.id);
        const { data: parts } = await (supabase as any)
          .from("recruitment_participants")
          .select("recruitment_id, status")
          .eq("user_id", user.id)
          .in("recruitment_id", ids);
        const statusMap: Record<string, "pending" | "approved" | "rejected" | "withdrawn"> = {};
        (Array.isArray(parts) ? parts : []).forEach((p: { recruitment_id: string; status: string }) => {
          if (["pending", "approved", "rejected", "withdrawn"].includes(p.status)) {
            statusMap[p.recruitment_id] = p.status as "pending" | "approved" | "rejected" | "withdrawn";
          }
        });
        setParticipantStatusByRecruitment(statusMap);
      }
    } catch (e) {
      console.error("Recruitment board fetch error:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecruitments();
  }, [fetchRecruitments]);

  type PostWithDate = RecruitmentPost & { event_date?: string };
  const safeBlockedIds = blockedIds instanceof Set ? blockedIds : new Set<string>();
  const displayPosts = ((): RecruitmentPost[] => {
    const safePosts = Array.isArray(posts) ? posts : [];
    const withDate = (safePosts as PostWithDate[]).filter((p) => !p.user_id || !safeBlockedIds.has(p.user_id));
    if (sort === "newest") return withDate;
    const now = Date.now();
    const sorted = [...withDate].sort((a, b) => {
      const tA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const tB = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (sort === "date_nearest") return Math.abs(tA - now) - Math.abs(tB - now);
      return Math.abs(tB - now) - Math.abs(tA - now);
    });
    return sorted.map(({ event_date: _ed, ...p }) => p);
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all duration-300 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/30 active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            合トレを募集する
          </button>
          <Link
            href="/dashboard/recruit/manage"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-gold/30 hover:bg-secondary/80"
          >
            <Settings2 className="h-5 w-5" />
            自分の合トレ管理
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            並び替え
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
          >
            <option value="newest">作成順 (Newest created)</option>
            <option value="date_nearest">開催日が近い順 (Date nearest)</option>
            <option value="date_furthest">開催日が遠い順 (Date furthest)</option>
          </select>
        </div>
      </div>
      <FilterBar />
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">まだ募集はありません</p>
          <button
            type="button"
            onClick={openModal}
            className="mt-3 text-sm font-bold text-gold hover:underline"
          >
            最初の募集を作成する
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(Array.isArray(displayPosts) ? displayPosts : []).map((post) => (
            <RecruitmentCard
              key={post.id}
              post={post}
              myUserId={myUserId}
              myDisplayName={myDisplayName}
              participantStatus={participantStatusByRecruitment[post.id]}
              onApplied={() => {
                if (myUserId) setParticipantStatusByRecruitment((prev) => ({ ...prev, [post.id]: "pending" }));
              }}
              onWithdrawn={() => {
                if (myUserId) setParticipantStatusByRecruitment((prev) => ({ ...prev, [post.id]: "withdrawn" }));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
