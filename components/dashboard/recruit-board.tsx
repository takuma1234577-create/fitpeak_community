"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Loader2, CalendarDays, MapPin, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import RecruitFilterBar, {
  DEFAULT_FILTERS,
  type RecruitFilters,
} from "@/components/dashboard/recruit-filter-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RecruitmentRow = {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  user_id: string;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
};

type RecruitmentDetail = RecruitmentRow & { level?: string | null };

export default function RecruitBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("r");

  const [filters, setFilters] = useState<RecruitFilters>(DEFAULT_FILTERS);
  const [list, setList] = useState<RecruitmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RecruitmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const modalOpen = !!detailId;

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let q = (supabase as any)
        .from("recruitments")
        .select("id, title, description, target_body_part, event_date, location, status, user_id, profiles(nickname, username, avatar_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (filters.area !== "all") {
        q = q.ilike("location", `%${filters.area}%`);
      }
      if (filters.bodyPart !== "all") {
        q = q.eq("target_body_part", filters.bodyPart);
      }
      if (filters.level !== "all") {
        q = q.eq("level", filters.level);
      }

      const { data, error } = await q;
      if (error) {
        console.error("[合トレ] 一覧取得失敗:", error);
        setList([]);
        return;
      }
      setList(safeList(data as RecruitmentRow[] | null));
    } catch (e) {
      console.error("[合トレ] 取得例外:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [filters.area, filters.bodyPart, filters.level]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from("recruitments")
          .select("id, title, description, target_body_part, event_date, location, status, user_id, level, profiles(nickname, username, avatar_url)")
          .eq("id", detailId)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          setDetail(null);
          return;
        }
        setDetail(data as RecruitmentDetail);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [detailId]);

  const closeDetail = useCallback(() => {
    router.push("/dashboard/recruit", { scroll: false });
  }, [router]);

  const formatDetailDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const levelLabel: Record<string, string> = {
    beginner: "初心者",
    intermediate: "中級者",
    advanced: "上級者",
    competitor: "大会勢",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          合トレ募集
        </h1>
        <Link
          href="/dashboard/recruit/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all hover:bg-gold-light hover:shadow-xl active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          合トレを募集する
        </Link>
      </div>

      <RecruitFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onApply={fetchList}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            条件に合う募集はありません
          </p>
          <Link
            href="/dashboard/recruit/new"
            className="mt-3 inline-block text-sm font-bold text-gold hover:underline"
          >
            最初の募集を作成する
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((r) => {
            const name = r.profiles?.nickname || r.profiles?.username || "ユーザー";
            const date = r.event_date
              ? new Date(r.event_date).toLocaleDateString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";
            return (
              <li key={r.id}>
                <Link
                  href={`/dashboard/recruit?r=${r.id}`}
                  className="block rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-gold/30 hover:bg-card/80"
                >
                  <p className="font-bold text-foreground">{r.title}</p>
                  {r.target_body_part && (
                    <span className="mt-1 inline-block text-xs text-gold">
                      {r.target_body_part}
                    </span>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {date} {r.location && `・${r.location}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">{name}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-md border-border/60 bg-card sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="sr-only">募集詳細</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {detail.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {detail.target_body_part && (
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                    {detail.target_body_part}
                  </span>
                )}
                {detail.level && levelLabel[detail.level] && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {levelLabel[detail.level]}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-gold/70" />
                  {formatDetailDate(detail.event_date)}
                </p>
                {detail.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-gold/70" />
                    {detail.location}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-gold/70" />
                  {detail.profiles?.nickname || detail.profiles?.username || "ユーザー"}
                </p>
              </div>
              {detail.description && (
                <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {detail.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              募集が見つかりませんでした
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
